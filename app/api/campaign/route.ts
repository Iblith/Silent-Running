// app/api/campaign/route.ts
// GET  /api/campaign  — fetch full campaign state
// PUT  /api/campaign  — save full campaign state

import { NextRequest, NextResponse } from 'next/server'
import { d1 } from '@/lib/db'

export async function GET() {
  try {
    const rows = await d1('SELECT * FROM campaign_state WHERE id = ?', ['main'])
    if (!rows.length) {
      return NextResponse.json({ error: 'Campaign state not found. Run POST /api/init first.' }, { status: 404 })
    }
    const r = rows[0] as any
    return NextResponse.json({
      session:       r.session,
      heatLevel:     r.heat_level,
      renausTrack:   r.renaus_track,
      mercyCount:    r.mercy_count,
      expedCount:    r.exped_count,
      ht:            r.ht,
      sst:           r.sst,
      stealthActive: !!r.stealth_active,
      missionStatus: JSON.parse(r.mission_status || '{}'),
      shipUpgrades:  JSON.parse(r.ship_upgrades  || '{}'),
      gmNotes:       r.gm_notes || '',
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const b = await req.json()
    await d1(
      `UPDATE campaign_state SET
        session        = ?,
        heat_level     = ?,
        renaus_track   = ?,
        mercy_count    = ?,
        exped_count    = ?,
        ht             = ?,
        sst            = ?,
        stealth_active = ?,
        mission_status = ?,
        ship_upgrades  = ?,
        gm_notes       = ?,
        updated_at     = datetime('now')
       WHERE id = 'main'`,
      [
        b.session       ?? 1,
        b.heatLevel     ?? 0,
        b.renausTrack   ?? 0,
        b.mercyCount    ?? 0,
        b.expedCount    ?? 0,
        b.ht            ?? 0,
        b.sst           ?? 0,
        b.stealthActive ? 1 : 0,
        JSON.stringify(b.missionStatus ?? {}),
        JSON.stringify(b.shipUpgrades  ?? {}),
        b.gmNotes       ?? '',
      ]
    )
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
