// app/api/space-combat/route.ts
// GET  /api/space-combat  — fetch full space combat state
// PUT  /api/space-combat  — save full space combat state

import { NextRequest, NextResponse } from 'next/server'
import { d1 } from '@/lib/db'

async function ensureTable() {
  await d1(`CREATE TABLE IF NOT EXISTS space_combat (
    id   TEXT PRIMARY KEY DEFAULT 'main',
    data TEXT NOT NULL DEFAULT '{}'
  )`)
  await d1(`INSERT OR IGNORE INTO space_combat (id, data) VALUES ('main', '{}')`)
}

export async function GET() {
  try {
    await ensureTable()
    const rows = await d1('SELECT data FROM space_combat WHERE id = ?', ['main'])
    const data = rows[0] ? JSON.parse((rows[0] as any).data || '{}') : {}
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await ensureTable()
    const body = await req.json()
    await d1('UPDATE space_combat SET data = ? WHERE id = ?', [JSON.stringify(body), 'main'])
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
