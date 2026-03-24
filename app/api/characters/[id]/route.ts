// app/api/characters/[id]/route.ts
// GET    /api/characters/:id — fetch one character
// PUT    /api/characters/:id — update one character
// DELETE /api/characters/:id — delete one character

import { NextRequest, NextResponse } from 'next/server'
import { d1 } from '@/lib/db'
import { getSession, COOKIE_NAME } from '@/lib/auth'
import { deserialise } from '@/lib/characters'

async function getUser(req: NextRequest) {
  return getSession(req.cookies.get(COOKIE_NAME)?.value)
}

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rows = await d1('SELECT * FROM characters WHERE id = ?', [params.id])
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(deserialise(rows[0]))
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const b = await req.json()
    await d1(
      `UPDATE characters SET
         name             = ?,
         player           = ?,
         species          = ?,
         career           = ?,
         specialisation   = ?,
         color_idx        = ?,
         characteristics  = ?,
         wounds           = ?,
         wound_threshold  = ?,
         strain           = ?,
         strain_threshold = ?,
         soak             = ?,
         defense          = ?,
         force_rating     = ?,
         duty             = ?,
         duty_type        = ?,
         morality         = ?,
         skills           = ?,
         talents          = ?,
         weapons          = ?,
         equipment        = ?,
         notes            = ?,
         xp               = ?,
         total_xp         = ?,
         updated_at       = datetime('now')
       WHERE id = ?`,
      [
        b.name            || 'New Character',
        b.player          || '',
        b.species         || '',
        b.career          || '',
        b.specialisation  || '',
        b.colorIdx        ?? 0,
        JSON.stringify(b.characteristics ?? {}),
        b.wounds          ?? 0,
        b.woundThreshold  ?? 12,
        b.strain          ?? 0,
        b.strainThreshold ?? 12,
        b.soak            ?? 2,
        b.defense         ?? 0,
        b.forceRating     ?? 0,
        b.duty            ?? 0,
        b.dutyType        ?? '',
        b.morality        ?? 50,
        JSON.stringify(b.skills    ?? {}),
        JSON.stringify(b.talents   ?? []),
        JSON.stringify(b.weapons   ?? []),
        JSON.stringify(b.equipment ?? []),
        b.notes           ?? '',
        b.xp              ?? 0,
        b.totalXp         ?? 0,
        params.id,
      ]
    )
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    if (user.role === 'gm') {
      await d1('DELETE FROM characters WHERE id = ?', [params.id])
    } else {
      const result = await d1<any>('DELETE FROM characters WHERE id = ? AND owner_id = ?', [params.id, user.id])
      if (!result.length && result[0]?.changes === 0)
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
