'use client'
// app/(app)/comms/page.tsx — Ship Comms: group chat + direct messages

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { api, useIsMobile } from '@/lib/ui'

const CHAR_COLORS = ['#2E86C1','#1E8449','#C0392B','#6C3483','#D4AC0D','#E67E22','#17A589']

// ── Colour assigned per user id (stable across renders) ──────────────────────
const USER_COLOR_CACHE: Record<string, string> = {}
function userColor(id: string, idx: number) {
  if (!USER_COLOR_CACHE[id]) USER_COLOR_CACHE[id] = CHAR_COLORS[idx % CHAR_COLORS.length]
  return USER_COLOR_CACHE[id]
}

// ── Format timestamp ──────────────────────────────────────────────────────────
function fmtTime(iso: string) {
  try {
    const d = new Date(iso + (iso.endsWith('Z') ? '' : 'Z'))
    return d.toLocaleTimeString(undefined, { hour:'2-digit', minute:'2-digit' })
  } catch { return '' }
}

function fmtDate(iso: string) {
  try {
    const d = new Date(iso + (iso.endsWith('Z') ? '' : 'Z'))
    return d.toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric' })
  } catch { return '' }
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE BUBBLE
// ─────────────────────────────────────────────────────────────────────────────
function Bubble({ msg, isMine, color }: { msg: any; isMine: boolean; color: string }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: isMine ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      gap: 8,
      marginBottom: 10,
    }}>
      {/* Avatar */}
      {!isMine && (
        <div style={{
          width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
          background: `${color}22`, border: `1px solid ${color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700, color,
        }}>
          {(msg.sender_name || '?')[0].toUpperCase()}
        </div>
      )}

      <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column',
                    alignItems: isMine ? 'flex-end' : 'flex-start', gap: 3 }}>
        {!isMine && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color, letterSpacing: '0.08em' }}>
            {msg.sender_name}
          </div>
        )}
        <div style={{
          padding: '9px 13px',
          borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
          background: isMine ? `rgba(212,172,13,0.15)` : 'rgba(255,255,255,0.05)',
          border: isMine ? '1px solid rgba(212,172,13,0.35)' : '1px solid rgba(255,255,255,0.1)',
          fontFamily: 'var(--body)', fontSize: 15, color: 'var(--text)',
          lineHeight: 1.5, wordBreak: 'break-word',
        }}>
          {msg.text}
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', opacity: 0.6 }}>
          {fmtTime(msg.created_at)}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DATE DIVIDER
// ─────────────────────────────────────────────────────────────────────────────
function DateDivider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0 10px' }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }}/>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)',
                     letterSpacing: '0.1em', opacity: 0.6 }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }}/>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function CommsPage() {
  const { user }   = useAuth()
  const myId       = user?.id || ''
  const isMobile   = useIsMobile()

  // channel: 'all' = group; any other string = user id of DM recipient
  const [channel,   setChannel]   = useState('all')
  const [messages,  setMessages]  = useState<any[]>([])
  const [users,     setUsers]     = useState<any[]>([])    // all other users
  const [chars,     setChars]     = useState<any[]>([])    // for colour mapping
  const [draft,     setDraft]     = useState('')
  const [sending,   setSending]   = useState(false)
  const [loading,   setLoading]   = useState(true)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const latestRef  = useRef<string>('')   // ISO of most recent message seen
  const inputRef   = useRef<HTMLInputElement>(null)

  // Track unread counts per channel
  const [unread, setUnread] = useState<Record<string, number>>({})

  // ── Load users + characters once ───────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch('/api/auth/users').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('/api/characters?all=1').then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([u, c]) => {
      setUsers((u || []).filter((u: any) => u.id !== myId))
      setChars(c || [])
    })
  }, [myId])

  // ── Fetch messages for current channel ─────────────────────────────────────
  const fetchMessages = useCallback(async (channelId: string, since?: string) => {
    const qs = since ? `?channel=${channelId}&since=${encodeURIComponent(since)}`
                     : `?channel=${channelId}`
    const rows: any[] = await fetch(`/api/messages${qs}`)
      .then(r => r.ok ? r.json() : []).catch(() => [])
    return rows
  }, [])

  // Full reload when channel changes
  useEffect(() => {
    setLoading(true)
    setMessages([])
    latestRef.current = ''
    fetchMessages(channel).then(rows => {
      setMessages(rows)
      if (rows.length) latestRef.current = rows[rows.length - 1].created_at
      setLoading(false)
      // Clear unread for this channel
      setUnread(u => ({ ...u, [channel]: 0 }))
    })
  }, [channel, fetchMessages])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Poll for new messages every 3 seconds ──────────────────────────────────
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current)

    const channels = ['all', ...users.map((u: any) => u.id)]

    pollRef.current = setInterval(async () => {
      // Poll current channel (incremental)
      if (latestRef.current) {
        const rows = await fetchMessages(channel, latestRef.current)
        if (rows.length) {
          setMessages(prev => [...prev, ...rows])
          latestRef.current = rows[rows.length - 1].created_at
        }
      }

      // Poll other channels for unread badges (just counts, no content)
      const others = channels.filter(c => c !== channel)
      for (const ch of others) {
        const since = latestRef.current  // rough approximation — good enough
        const rows = await fetchMessages(ch, since)
        if (rows.length) {
          const newFromOthers = rows.filter((m: any) => m.sender_id !== myId)
          if (newFromOthers.length) {
            setUnread(u => ({ ...u, [ch]: (u[ch] || 0) + newFromOthers.length }))
          }
        }
      }
    }, 3000)

    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [channel, users, fetchMessages, myId])

  // ── Send ───────────────────────────────────────────────────────────────────
  async function send() {
    const text = draft.trim()
    if (!text || sending) return
    setSending(true)
    setDraft('')
    try {
      const recipientId = channel === 'all' ? null : channel
      await api('/api/messages', 'POST', { text, recipientId })
      // Optimistically append
      const optimistic = {
        id: crypto.randomUUID(), sender_id: myId,
        sender_name: user?.username || '', recipient_id: recipientId,
        text, created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, optimistic])
      latestRef.current = optimistic.created_at
    } catch {}
    setSending(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  // ── Derived: group messages with date dividers ─────────────────────────────
  const grouped: Array<{ type: 'date'; label: string } | { type: 'msg'; msg: any }> = []
  let lastDate = ''
  for (const msg of messages) {
    const d = fmtDate(msg.created_at)
    if (d !== lastDate) { grouped.push({ type: 'date', label: d }); lastDate = d }
    grouped.push({ type: 'msg', msg })
  }

  // ── Colour helpers ─────────────────────────────────────────────────────────
  function colorForUser(userId: string) {
    const allUsers = [{ id: myId }, ...users]
    const idx = allUsers.findIndex(u => u.id === userId)
    return userColor(userId, idx < 0 ? 0 : idx)
  }

  const activeUser = users.find((u: any) => u.id === channel)
  const activeName = channel === 'all' ? 'All Crew' : activeUser?.username || 'DM'

  // Mobile: show sidebar or chat, not both
  const [mobileSidebar, setMobileSidebar] = useState(true)
  const mobileShowSidebar = !isMobile || mobileSidebar
  const mobileShowChat    = !isMobile || !mobileSidebar

  function openChannel(ch: string) {
    setChannel(ch)
    setUnread(u => ({ ...u, [ch]: 0 }))
    if (isMobile) setMobileSidebar(false)
  }

  return (
    <div style={{ height: '100%', display: 'flex', background: 'var(--bg)', overflow: 'hidden' }}>

      {/* ── SIDEBAR ── */}
      {mobileShowSidebar && (
        <div style={{
          width: isMobile ? '100%' : 220, flexShrink: 0,
          background: 'var(--bg2)', borderRight: isMobile ? 'none' : '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid var(--border)',
            fontFamily: 'var(--display)', fontSize: 15, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)',
          }}>
            Ship Comms
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 6px' }}>

            {/* Group channel */}
            <div style={{ padding: '4px 6px 8px', fontFamily: 'var(--mono)', fontSize: 11,
                          color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Channels
            </div>
            <ChannelBtn
              label="All Crew"
              icon="◉"
              active={channel === 'all'}
              unread={unread['all'] || 0}
              onClick={() => openChannel('all')}
            />

            {/* DMs */}
            {users.length > 0 && (
              <>
                <div style={{ padding: '12px 6px 8px', fontFamily: 'var(--mono)', fontSize: 11,
                              color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Direct
                </div>
                {users.map((u: any, i: number) => (
                  <ChannelBtn
                    key={u.id}
                    label={u.username}
                    icon={(u.username || '?')[0].toUpperCase()}
                    color={colorForUser(u.id)}
                    active={channel === u.id}
                    unread={unread[u.id] || 0}
                    onClick={() => openChannel(u.id)}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── CHAT AREA ── */}
      {mobileShowChat && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Chat header */}
          <div style={{
            flexShrink: 0, padding: '0 16px', height: 48,
            borderBottom: '1px solid var(--border)', background: 'var(--panel)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            {isMobile && (
              <button onClick={() => setMobileSidebar(true)}
                style={{ background: 'none', border: 'none', color: 'var(--gold)',
                         fontSize: 20, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>
                ‹
              </button>
            )}
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: channel === 'all' ? 'rgba(212,172,13,0.15)' : `${colorForUser(channel)}22`,
              border: `1px solid ${channel === 'all' ? 'rgba(212,172,13,0.4)' : colorForUser(channel)}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700,
              color: channel === 'all' ? 'var(--gold)' : colorForUser(channel),
            }}>
              {channel === 'all' ? '◉' : activeName[0]?.toUpperCase()}
            </div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700,
                          color: 'var(--text-bright)', letterSpacing: '0.06em' }}>
              {activeName}
            </div>
            {channel !== 'all' && (
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)',
                            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                            borderRadius: 3, padding: '2px 7px' }}>
                DIRECT
              </div>
            )}
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '16px 20px',
            display: 'flex', flexDirection: 'column',
          }}>
            {loading && (
              <div style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'var(--mono)',
                            fontSize: 13, color: 'var(--text-dim)' }}>
                Loading transmission log…
              </div>
            )}
            {!loading && messages.length === 0 && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexDirection: 'column', gap: 10, opacity: 0.4 }}>
                <div style={{ fontSize: 40 }}>◉</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text-dim)',
                              textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {channel === 'all' ? 'No crew transmissions yet' : 'No messages yet'}
                </div>
              </div>
            )}
            {grouped.map((item, i) =>
              item.type === 'date'
                ? <DateDivider key={`d-${i}`} label={item.label} />
                : <Bubble
                    key={item.msg.id}
                    msg={item.msg}
                    isMine={item.msg.sender_id === myId}
                    color={colorForUser(item.msg.sender_id)}
                  />
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Input */}
          <div style={{
            flexShrink: 0, padding: '10px 16px',
            borderTop: '1px solid var(--border)', background: 'var(--panel)',
            display: 'flex', gap: 10, alignItems: 'center',
          }}>
            <input
              ref={inputRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={handleKey}
              placeholder={channel === 'all' ? 'Message all crew…' : `Message ${activeName}…`}
              disabled={sending}
              style={{
                flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 20, padding: '9px 16px', color: 'var(--text)',
                fontFamily: 'var(--body)', fontSize: 15, outline: 'none',
                opacity: sending ? 0.6 : 1,
              }}
            />
            <button onClick={send} disabled={!draft.trim() || sending}
              style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                border: '1px solid rgba(212,172,13,0.5)',
                background: draft.trim() ? 'rgba(212,172,13,0.2)' : 'transparent',
                color: draft.trim() ? 'var(--gold)' : 'var(--text-dim)',
                fontSize: 18, cursor: draft.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}>
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CHANNEL BUTTON
// ─────────────────────────────────────────────────────────────────────────────
function ChannelBtn({ label, icon, color, active, unread, onClick }:
  { label: string; icon: string; color?: string; active: boolean; unread: number; onClick: () => void }) {
  const col = color || 'var(--gold)'
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', background: active ? `rgba(212,172,13,0.08)` : 'transparent',
      border: 'none', borderRadius: 6, padding: '9px 10px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2,
      outline: active ? '1px solid rgba(212,172,13,0.25)' : 'none',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: `${col}18`, border: `1px solid ${col}50`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700, color: col,
      }}>
        {icon}
      </div>
      <span style={{
        flex: 1, fontFamily: 'var(--display)', fontSize: 14, fontWeight: 600,
        color: active ? 'var(--gold)' : 'var(--text)',
        letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      {unread > 0 && (
        <span style={{
          background: 'var(--red)', color: '#fff', borderRadius: 10,
          fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
          padding: '1px 6px', minWidth: 18, textAlign: 'center', flexShrink: 0,
        }}>
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </button>
  )
}
