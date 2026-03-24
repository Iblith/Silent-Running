// app/api/auth/login/route.ts
// POST /api/auth/login — validate credentials, set session cookie

import { NextRequest, NextResponse } from 'next/server'
import { d1 } from '@/lib/db'
import { verifyPassword, createSession, COOKIE_NAME } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    if (!username || !password)
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })

    const rows = await d1<any>('SELECT * FROM users WHERE username = ?', [username.toLowerCase().trim()])
    const user = rows[0]
    if (!user || !(await verifyPassword(password, user.password_hash)))
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })

    const token = await createSession(user.id)
    const res = NextResponse.json({
      ok: true,
      id: user.id,
      username: user.username,
      role: user.role,
      characterId: user.character_id || '',
    })
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 86_400,
    })
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
