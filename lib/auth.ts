// lib/auth.ts
// Password hashing (PBKDF2 via Web Crypto) and session management.
// Works in Node 18+, Cloudflare Workers, and Vercel Edge.

import { d1 } from './db'

export const COOKIE_NAME = 'sr_session'
const SESSION_DAYS = 7

// ── Password hashing ──────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  const enc  = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key  = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    key, 256
  )
  const hex = (b: Uint8Array) => Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('')
  return `${hex(salt)}:${hex(new Uint8Array(bits))}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':')
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(b => parseInt(b, 16)))
  const enc  = new TextEncoder()
  const key  = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    key, 256
  )
  const newHash = Array.from(new Uint8Array(bits)).map(x => x.toString(16).padStart(2, '0')).join('')
  return newHash === hashHex
}

// ── Session management ────────────────────────────────────────────────────────

export type SessionUser = {
  id: string
  username: string
  role: 'gm' | 'player'
  character_id: string
}

export async function createSession(userId: string): Promise<string> {
  const token   = `${crypto.randomUUID()}-${crypto.randomUUID()}`
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString()
  await d1('INSERT INTO sessions (token, user_id, expires_at) VALUES (?,?,?)', [token, userId, expires])
  return token
}

export async function getSession(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null
  const rows = await d1<any>(
    `SELECT u.id, u.username, u.role, u.character_id
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token = ? AND s.expires_at > datetime('now')`,
    [token]
  )
  return rows[0] ?? null
}

export async function deleteSession(token: string): Promise<void> {
  await d1('DELETE FROM sessions WHERE token = ?', [token])
}
