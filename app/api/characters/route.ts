// app/api/characters/route.ts
// GET  /api/characters      — list all characters
// POST /api/characters      — create a new character

import { NextRequest, NextResponse } from 'next/server'
import { d1 } from '@/lib/db'
import { deserialise, serialiseParams } from '@/lib/characters'

export async function GET() {
  try {
    const rows = await d1('SELECT * FROM characters ORDER BY updated_at DESC')
    return NextResponse.json(rows.map(deserialise))
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const id = body.id || crypto.randomUUID()
    await d1(
      `INSERT INTO characters (
         id, name, player, species, career, specialisation, color_idx,
         characteristics, wounds, wound_threshold, strain, strain_threshold,
         soak, defense, force_rating, duty, duty_type, morality,
         skills, talents, weapons, equipment, notes, xp, total_xp
       ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      serialiseParams({ ...body, id })
    )
    return NextResponse.json({ ok: true, id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
