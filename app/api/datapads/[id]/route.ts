// app/api/datapads/[id]/route.ts
// PATCH  /api/datapads/:id  — GM: any field; player: own entry title/content only
// DELETE /api/datapads/:id  — GM: any; player: own entries only

import { NextRequest, NextResponse } from 'next/server'
import { d1 } from '@/lib/db'
import { getSession, COOKIE_NAME } from '@/lib/auth'

async function getUser(req: NextRequest) {
  return getSession(req.cookies.get(COOKIE_NAME)?.value)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const body = await req.json()
    const sets: string[] = []
    const vals: any[]    = []

    if (user.role === 'gm') {
      // GM can update any field including reveal status
      if (body.title    !== undefined) { sets.push('title = ?');    vals.push(body.title) }
      if (body.content  !== undefined) { sets.push('content = ?');  vals.push(body.content) }
      if (body.revealed !== undefined) { sets.push('revealed = ?'); vals.push(body.revealed ? 1 : 0) }
      if (sets.length === 0) return NextResponse.json({ ok: true })
      vals.push(params.id)
      await d1(`UPDATE datapads SET ${sets.join(', ')} WHERE id = ?`, vals)
    } else {
      // Players can only edit their own entries (title + content only)
      if (body.title   !== undefined) { sets.push('title = ?');   vals.push(body.title) }
      if (body.content !== undefined) { sets.push('content = ?'); vals.push(body.content) }
      if (sets.length === 0) return NextResponse.json({ ok: true })
      vals.push(params.id, user.id)
      await d1(`UPDATE datapads SET ${sets.join(', ')} WHERE id = ? AND owner_id = ?`, vals)
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    if (user.role === 'gm') {
      await d1(`DELETE FROM datapads WHERE id = ?`, [params.id])
    } else {
      await d1(`DELETE FROM datapads WHERE id = ? AND owner_id = ?`, [params.id, user.id])
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
