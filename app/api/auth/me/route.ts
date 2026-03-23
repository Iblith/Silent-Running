// app/api/auth/me/route.ts
// GET /api/auth/me — return current user from session cookie

import { NextRequest, NextResponse } from 'next/server'
import { getSession, COOKIE_NAME } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await getSession(req.cookies.get(COOKIE_NAME)?.value)
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    return NextResponse.json({
      username: user.username,
      role: user.role,
      characterId: user.character_id || '',
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
