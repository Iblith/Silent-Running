// app/api/datapads/[id]/route.ts
// PATCH  /api/datapads/:id  — GM only; update title, content, or revealed flag
// DELETE /api/datapads/:id  — GM only; delete a datapad

import { NextRequest, NextResponse } from 'next/server'
import { d1 } from '@/lib/db'
import { getSession, COOKIE_NAME } from '@/lib/auth'

async function getUser(req: NextRequest) {
  return getSession(req.cookies.get(COOKIE_NAME)?.value)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUser(req)
    if (!user || user.role !== 'gm') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const sets: string[] = []
    const vals: any[]    = []

    if (body.title   !== undefined) { sets.push('title = ?');    vals.push(body.title) }
    if (body.content !== undefined) { sets.push('content = ?');  vals.push(body.content) }
    if (body.revealed !== undefined) { sets.push('revealed = ?'); vals.push(body.revealed ? 1 : 0) }

    if (sets.length === 0) return NextResponse.json({ ok: true })

    vals.push(params.id)
    await d1(`UPDATE datapads SET ${sets.join(', ')} WHERE id = ?`, vals)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUser(req)
    if (!user || user.role !== 'gm') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await d1(`DELETE FROM datapads WHERE id = ?`, [params.id])
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
