// app/api/initiative/route.ts
// GET /api/initiative       — fetch full combat state (round, slots, log)
// PUT /api/initiative       — action-based mutations

import { NextRequest, NextResponse } from 'next/server'
import { d1 } from '@/lib/db'

export async function GET() {
  try {
    const [stateRows, slotRows, logRows] = await Promise.all([
      d1('SELECT * FROM initiative_state WHERE id = ?', ['main']),
      d1('SELECT * FROM initiative_slots ORDER BY sort_order ASC, id ASC'),
      d1('SELECT * FROM combat_log ORDER BY id DESC LIMIT 60'),
    ])
    const state = (stateRows[0] as any) ?? { round: 1, current_idx: 0 }
    return NextResponse.json({
      round:      state.round,
      currentIdx: state.current_idx,
      slots: slotRows.map((r: any) => ({
        id:        r.id,
        name:      r.name,
        type:      r.type,
        wt:        r.wt,
        st:        r.st,
        wounds:    r.wounds,
        strain:    r.strain,
        crits:     JSON.parse(r.crits || '[]'),
        used:      !!r.used,
        charId:    r.char_id,
        sortOrder: r.sort_order,
      })),
      log: logRows.map((r: any) => ({
        id:      r.id,
        message: r.message,
        type:    r.type,
        time:    r.created_at,
      })),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    // ── Advance to next initiative slot ──────────────────────────────────────
    if (action === 'advance') {
      const stateRows = await d1('SELECT * FROM initiative_state WHERE id = ?', ['main'])
      const slots     = await d1('SELECT * FROM initiative_slots ORDER BY sort_order ASC, id ASC')
      const state     = (stateRows[0] as any) ?? { round: 1, current_idx: 0 }

      let next  = (state.current_idx ?? 0) + 1
      let round = state.round ?? 1

      if (next >= slots.length) { next = 0; round++ }

      await d1(
        'UPDATE initiative_state SET round = ?, current_idx = ? WHERE id = ?',
        [round, next, 'main']
      )

      if (next === 0) await addLog(`— Round ${round} begins —`, 'important')
      if (slots[next]) await addLog(`${(slots[next] as any).name}'s turn`, '')

      return NextResponse.json({ ok: true, round, currentIdx: next })
    }

    // ── Add a combatant slot ──────────────────────────────────────────────────
    if (action === 'add_slot') {
      const s = body.slot
      const sortOrder = s.type === 'player' ? 0 : s.type === 'npc' ? 1 : 2
      const id = s.id || crypto.randomUUID()
      await d1(
        `INSERT INTO initiative_slots (id, name, type, wt, st, wounds, strain, crits, used, char_id, sort_order)
         VALUES (?,?,?,?,?,0,0,'[]',0,?,?)`,
        [id, s.name, s.type, s.wt || 12, s.st || 12, s.charId || '', sortOrder]
      )
      await addLog(`${s.name} added to initiative`, 'important')
      return NextResponse.json({ ok: true })
    }

    // ── Update a slot's wound/strain/crits/used ───────────────────────────────
    if (action === 'update_slot') {
      const { id, wounds, strain, crits, used } = body
      await d1(
        'UPDATE initiative_slots SET wounds = ?, strain = ?, crits = ?, used = ? WHERE id = ?',
        [wounds ?? 0, strain ?? 0, JSON.stringify(crits ?? []), used ? 1 : 0, id]
      )
      return NextResponse.json({ ok: true })
    }

    // ── Remove a slot ─────────────────────────────────────────────────────────
    if (action === 'remove_slot') {
      await d1('DELETE FROM initiative_slots WHERE id = ?', [body.id])
      return NextResponse.json({ ok: true })
    }

    // ── Full combat reset ─────────────────────────────────────────────────────
    if (action === 'reset') {
      await d1('DELETE FROM initiative_slots', [])
      await d1('DELETE FROM combat_log', [])
      await d1('UPDATE initiative_state SET round = 1, current_idx = 0 WHERE id = ?', ['main'])
      await addLog('Combat reset', 'important')
      return NextResponse.json({ ok: true })
    }

    // ── Manually add a log entry (e.g. dice roll results) ────────────────────
    if (action === 'add_log') {
      await addLog(body.message, body.type || '')
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

async function addLog(message: string, type: string) {
  await d1(
    'INSERT INTO combat_log (message, type) VALUES (?, ?)',
    [message, type]
  )
}
