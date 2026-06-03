// app/api/messages/route.ts
// GET  /api/messages?channel=all&since=<iso>  — fetch messages (group or DM)
// POST /api/messages                           — send a message

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

    const channel   = req.nextUrl.searchParams.get('channel') || 'all'
    const since     = req.nextUrl.searchParams.get('since')
    const sinceClause = since ? `AND created_at > ?` : ''
    const sinceParam  = since ? [since] : []

    let rows: any[]
    if (channel === 'all') {
      rows = await d1(
        `SELECT * FROM messages WHERE recipient_id IS NULL ${sinceClause} ORDER BY created_at ASC LIMIT 200`,
        sinceParam
      )
    } else {
      // DM channel — show messages between these two users in either direction
      rows = await d1(
        `SELECT * FROM messages
         WHERE recipient_id IS NOT NULL
           AND ((sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?))
           ${sinceClause}
         ORDER BY created_at ASC LIMIT 200`,
        [user.id, channel, channel, user.id, ...sinceParam]
      )
    }

    return NextResponse.json(rows)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const body        = await req.json()
    const text        = (body.text || '').trim()
    if (!text) return NextResponse.json({ error: 'Empty message' }, { status: 400 })

    const recipientId = body.recipientId || null
    const id          = crypto.randomUUID()

    await d1(
      `INSERT INTO messages (id, sender_id, sender_name, recipient_id, text, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [id, user.id, user.username, recipientId, text]
    )

    return NextResponse.json({ ok: true, id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
