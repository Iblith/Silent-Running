// app/api/auth/signup/route.ts
// POST /api/auth/signup — public self-registration, always creates a 'player' account
// Players won't have a character linked until the GM assigns one.

import { NextRequest, NextResponse } from 'next/server'
import { d1 } from '@/lib/db'
import { hashPassword, createSession, COOKIE_NAME } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    if (!username || !password)
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    if (password.length < 6)
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })

    const id   = crypto.randomUUID()
    const hash = await hashPassword(password)
    await d1(
      'INSERT INTO users (id, username, password_hash, role, character_id) VALUES (?,?,?,?,?)',
      [id, username.toLowerCase().trim(), hash, 'player', '']
    )

    // Auto-login after signup
    const token = await createSession(id)
    const res = NextResponse.json({ ok: true, id, username: username.toLowerCase().trim(), role: 'player', characterId: '' })
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
    return res
  } catch (e: any) {
    if (e.message?.includes('UNIQUE'))
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
