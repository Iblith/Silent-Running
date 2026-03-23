// app/api/auth/users/[id]/route.ts
// PATCH  /api/auth/users/:id — update password / character link / role (GM only)
// DELETE /api/auth/users/:id — delete user (GM only)

import { NextRequest, NextResponse } from 'next/server'
import { d1 } from '@/lib/db'
import { getSession, hashPassword, COOKIE_NAME } from '@/lib/auth'

async function requireGm(req: NextRequest) {
  const session = await getSession(req.cookies.get(COOKIE_NAME)?.value)
  if (!session || session.role !== 'gm') return null
  return session
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gm = await requireGm(req)
    if (!gm) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { password, characterId, role } = await req.json()
    if (password) {
      const hash = await hashPassword(password)
      await d1('UPDATE users SET password_hash = ? WHERE id = ?', [hash, params.id])
    }
    if (characterId !== undefined) {
      await d1('UPDATE users SET character_id = ? WHERE id = ?', [characterId, params.id])
    }
    if (role) {
      await d1('UPDATE users SET role = ? WHERE id = ?', [role, params.id])
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gm = await requireGm(req)
    if (!gm) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (gm.id === params.id)
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })

    await d1('DELETE FROM sessions WHERE user_id = ?', [params.id])
    await d1('DELETE FROM users WHERE id = ?', [params.id])
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
