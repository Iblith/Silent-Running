// app/api/datapads/route.ts
// GET  /api/datapads  — GM: all; player: revealed + own entries
// POST /api/datapads  — any authenticated user; player entries auto-revealed

import { NextRequest, NextResponse } from 'next/server'
import { d1 } from '@/lib/db'
import { getSession, COOKIE_NAME } from '@/lib/auth'

async function getUser(req: NextRequest) {
  return getSession(req.cookies.get(COOKIE_NAME)?.value)
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const rows = user.role === 'gm'
      ? await d1('SELECT * FROM datapads ORDER BY created_at DESC')
      : await d1('SELECT * FROM datapads WHERE revealed = 1 OR owner_id = ? ORDER BY created_at DESC', [user.id])

    return NextResponse.json(rows)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const body    = await req.json()
    const id      = crypto.randomUUID()
    const title   = body.title || 'Untitled'
    const content = body.content || ''
    // GM entries start hidden; player entries are immediately visible to all
    const revealed = user.role === 'gm' ? 0 : 1

    await d1(
      `INSERT INTO datapads (id, title, content, revealed, owner_id) VALUES (?, ?, ?, ?, ?)`,
      [id, title, content, revealed, user.id]
    )
    return NextResponse.json({ ok: true, id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
