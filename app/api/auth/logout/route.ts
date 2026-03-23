// app/api/auth/logout/route.ts
// POST /api/auth/logout — delete session, clear cookie

import { NextRequest, NextResponse } from 'next/server'
import { deleteSession, COOKIE_NAME } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (token) await deleteSession(token).catch(() => {})
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' })
  return res
}
