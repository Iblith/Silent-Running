// app/api/auth/characters/route.ts
// GET /api/auth/characters — public list of character names (for login picker)

import { NextResponse } from 'next/server'
import { d1 } from '@/lib/db'

export async function GET() {
  try {
    const rows = await d1<any>('SELECT id, name, color_idx FROM characters ORDER BY name ASC')
    return NextResponse.json(rows.map(r => ({ id: r.id, name: r.name, colorIdx: r.color_idx })))
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
