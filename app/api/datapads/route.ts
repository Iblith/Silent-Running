// app/api/datapads/route.ts
// GET  /api/datapads  — GM: all; player: revealed only
// POST /api/datapads  — GM only; create a new datapad

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
      : await d1('SELECT * FROM datapads WHERE revealed = 1 ORDER BY created_at DESC')

    return NextResponse.json(rows)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user || user.role !== 'gm') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body    = await req.json()
    const id      = crypto.randomUUID()
    const title   = body.title || 'Untitled'
    const content = body.content || ''

    await d1(
      `INSERT INTO datapads (id, title, content, revealed) VALUES (?, ?, ?, 0)`,
      [id, title, content]
    )
    return NextResponse.json({ ok: true, id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
