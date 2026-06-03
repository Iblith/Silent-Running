// app/api/auth/character-login/route.ts
// POST /api/auth/character-login — passwordless login by character id
// Finds (or creates) a player account linked to the character and starts a session.

import { NextRequest, NextResponse } from 'next/server'
import { d1 } from '@/lib/db'
import { createSession, hashPassword, COOKIE_NAME } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { characterId } = await req.json()
    if (!characterId) return NextResponse.json({ error: 'No character selected' }, { status: 400 })

    const chars = await d1<any>('SELECT id, name FROM characters WHERE id = ?', [characterId])
    if (!chars.length) return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    const char = chars[0]

    // Find the player account linked to this character
    let users = await d1<any>('SELECT * FROM users WHERE character_id = ? AND role = ?', [characterId, 'player'])
    let user = users[0]

    // Auto-create an account if none exists yet
    if (!user) {
      const id   = crypto.randomUUID()
      const slug = char.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
      const hash = await hashPassword(crypto.randomUUID()) // random — never used for auth
      await d1(
        'INSERT OR IGNORE INTO users (id, username, password_hash, role, character_id) VALUES (?,?,?,?,?)',
        [id, slug, hash, 'player', characterId]
      )
      users = await d1<any>('SELECT * FROM users WHERE id = ?', [id])
      user = users[0]
    }

    if (!user) return NextResponse.json({ error: 'Could not resolve player account' }, { status: 500 })

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
