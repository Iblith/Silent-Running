// app/api/characters/route.ts
// GET  /api/characters        — list characters (GM: all; player: own only)
// GET  /api/characters?all=1  — list all characters (any authenticated user, for crew display)
// POST /api/characters        — create a character (GM or player; owner_id set from session)

import { NextRequest, NextResponse } from 'next/server'
import { d1 } from '@/lib/db'
import { getSession, COOKIE_NAME } from '@/lib/auth'
import { deserialise, serialiseParams } from '@/lib/characters'

async function getUser(req: NextRequest) {
  return getSession(req.cookies.get(COOKIE_NAME)?.value)
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const all = req.nextUrl.searchParams.get('all')
    const rows = (user.role === 'gm' || all)
      ? await d1('SELECT * FROM characters ORDER BY updated_at DESC')
      : await d1('SELECT * FROM characters WHERE owner_id = ? ORDER BY updated_at DESC', [user.id])

    return NextResponse.json(rows.map(deserialise))
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const body    = await req.json()
    const id      = body.id || crypto.randomUUID()
    const ownerId = user.role === 'gm' ? '' : user.id

    await d1(
      `INSERT INTO characters (
         id, name, player, species, career, specialisation, color_idx,
         characteristics, wounds, wound_threshold, strain, strain_threshold,
         soak, defense, force_rating, duty, duty_type, morality,
         skills, talents, weapons, equipment, notes, xp, total_xp, owner_id
       ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [...serialiseParams({ ...body, id }), ownerId]
    )
    return NextResponse.json({ ok: true, id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
