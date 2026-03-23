// app/api/auth/users/route.ts
// GET  /api/auth/users — list all users (GM only)
// POST /api/auth/users — create a user (GM only)

import { NextRequest, NextResponse } from 'next/server'
import { d1 } from '@/lib/db'
import { getSession, hashPassword, COOKIE_NAME } from '@/lib/auth'

async function requireGm(req: NextRequest) {
  const session = await getSession(req.cookies.get(COOKIE_NAME)?.value)
  if (!session || session.role !== 'gm') return null
  return session
}

export async function GET(req: NextRequest) {
  try {
    if (!(await requireGm(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const users = await d1<any>('SELECT id, username, role, character_id FROM users ORDER BY username')
    return NextResponse.json(users)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await requireGm(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { username, password, role, characterId } = await req.json()
    if (!username || !password)
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })

    const id   = crypto.randomUUID()
    const hash = await hashPassword(password)
    await d1(
      'INSERT INTO users (id, username, password_hash, role, character_id) VALUES (?,?,?,?,?)',
      [id, username.toLowerCase().trim(), hash, role || 'player', characterId || '']
    )
    return NextResponse.json({ ok: true, id })
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
