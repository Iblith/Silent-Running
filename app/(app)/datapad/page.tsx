'use client'
// app/(app)/datapad/page.tsx
// GM: compose and reveal messages/letters to players via a datapad interface.
// Players: read any messages the GM has revealed.

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { api, Btn, SBtn } from '@/lib/ui'

interface Datapad {
  id: string
  title: string
  content: string
  revealed: number
  created_at: string
}

// ─────────────────────────────────────────────────────────────────────────────
// DATAPAD CARD — read-only view for players (and GM preview)
// ─────────────────────────────────────────────────────────────────────────────
function DatapadCard({ pad }: { pad: Datapad }) {
  return (
    <div style={{
      background:'var(--panel)',
      border:'1px solid rgba(74,166,90,0.35)',
      borderRadius:8,
      overflow:'hidden',
      boxShadow:'0 0 12px rgba(74,166,90,0.08)',
    }}>
      {/* Terminal header bar */}
      <div style={{
        background:'rgba(74,166,90,0.10)',
        borderBottom:'1px solid rgba(74,166,90,0.25)',
        padding:'8px 16px',
        display:'flex',alignItems:'center',gap:10,
      }}>
        <span style={{fontFamily:'var(--mono)',fontSize:13,color:'rgba(74,166,90,0.7)',letterSpacing:'0.12em'}}>
          ■ DATAPAD — RECEIVED
        </span>
        <span style={{fontFamily:'var(--mono)',fontSize:13,color:'var(--text-dim)',marginLeft:'auto'}}>
          {new Date(pad.created_at).toLocaleString()}
        </span>
      </div>
      <div style={{padding:'14px 16px'}}>
        <div style={{fontFamily:'var(--display)',fontSize:18,fontWeight:700,
                     color:'var(--text-bright)',marginBottom:10}}>
          {pad.title}
        </div>
        <div style={{fontFamily:'var(--body)',fontSize:15,color:'var(--text)',
                     lineHeight:1.7,whiteSpace:'pre-wrap'}}>
          {pad.content}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GM EDITOR CARD
// ─────────────────────────────────────────────────────────────────────────────
function GMDatapadCard({
  pad,
  onReveal,
  onDelete,
  onSave,
}: {
  pad: Datapad
  onReveal: (id: string, revealed: boolean) => void
  onDelete: (id: string) => void
  onSave:   (id: string, title: string, content: string) => void
}) {
  const [editing, setEditing]   = useState(false)
  const [title,   setTitle]     = useState(pad.title)
  const [content, setContent]   = useState(pad.content)

  function handleSave() {
    onSave(pad.id, title, content)
    setEditing(false)
  }

  const revealed = !!pad.revealed

  return (
    <div style={{
      background:'var(--panel)',
      border:`1px solid ${revealed ? 'rgba(74,166,90,0.5)' : 'var(--border)'}`,
      borderRadius:8,
      overflow:'hidden',
    }}>
      {/* Header */}
      <div style={{
        background: revealed ? 'rgba(74,166,90,0.08)' : 'transparent',
        borderBottom:'1px solid var(--border)',
        padding:'8px 12px',
        display:'flex',alignItems:'center',gap:8,
      }}>
        <span style={{
          fontFamily:'var(--mono)',fontSize:13,letterSpacing:'0.08em',
          color: revealed ? 'rgba(74,166,90,0.9)' : 'var(--text-dim)',
          background: revealed ? 'rgba(74,166,90,0.12)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${revealed ? 'rgba(74,166,90,0.35)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius:3,padding:'2px 8px',
        }}>
          {revealed ? '● REVEALED' : '○ HIDDEN'}
        </span>
        <span style={{fontFamily:'var(--mono)',fontSize:13,color:'var(--text-dim)',marginLeft:'auto'}}>
          {new Date(pad.created_at).toLocaleString()}
        </span>
      </div>

      {/* Body */}
      <div style={{padding:'12px 14px'}}>
        {editing ? (
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <input
              value={title}
              onChange={e=>setTitle(e.target.value)}
              placeholder="Title"
              style={{background:'var(--panel2)',border:'1px solid var(--border)',borderRadius:6,
                      padding:'7px 10px',color:'var(--text)',fontFamily:'var(--display)',
                      fontSize:16,fontWeight:700,outline:'none'}}/>
            <textarea
              value={content}
              onChange={e=>setContent(e.target.value)}
              rows={6}
              placeholder="Message content…"
              style={{background:'var(--panel2)',border:'1px solid var(--border)',borderRadius:6,
                      padding:'8px 10px',color:'var(--text)',fontFamily:'var(--body)',
                      fontSize:15,outline:'none',resize:'vertical',lineHeight:1.6}}/>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <Btn variant="ghost" onClick={()=>{ setTitle(pad.title); setContent(pad.content); setEditing(false) }}>Cancel</Btn>
              <Btn variant="primary" onClick={handleSave}>Save</Btn>
            </div>
          </div>
        ) : (
          <>
            <div style={{fontFamily:'var(--display)',fontSize:17,fontWeight:700,
                         color:'var(--text-bright)',marginBottom:6}}>{pad.title}</div>
            <div style={{fontFamily:'var(--body)',fontSize:15,color:'var(--text)',
                         lineHeight:1.6,whiteSpace:'pre-wrap',marginBottom:12}}>
              {pad.content || <span style={{color:'var(--text-dim)',fontStyle:'italic'}}>No content.</span>}
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <Btn variant={revealed ? 'ghost' : 'primary'} onClick={()=>onReveal(pad.id, !revealed)}>
                {revealed ? 'Hide from players' : 'Reveal to players'}
              </Btn>
              <Btn variant="ghost" onClick={()=>setEditing(true)}>Edit</Btn>
              <Btn variant="danger" onClick={()=>onDelete(pad.id)}>Delete</Btn>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function DatapadPage() {
  const { user } = useAuth()
  const isGm     = user?.role === 'gm'

  const [pads,    setPads]    = useState<Datapad[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  // New datapad form (GM only)
  const [newTitle,   setNewTitle]   = useState('')
  const [newContent, setNewContent] = useState('')
  const [saving,     setSaving]     = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    api('/api/datapads')
      .then((data: Datapad[]) => { setPads(data); setLoading(false) })
      .catch((e: any) => { setError(e.message); setLoading(false) })
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCreate() {
    if (!newTitle.trim()) return
    setSaving(true)
    try {
      await api('/api/datapads', 'POST', { title: newTitle, content: newContent })
      setNewTitle(''); setNewContent('')
      load()
    } catch(e:any) { setError(e.message) }
    setSaving(false)
  }

  async function handleReveal(id: string, revealed: boolean) {
    await api(`/api/datapads/${id}`, 'PATCH', { revealed })
    setPads(ps => ps.map(p => p.id===id ? {...p, revealed: revealed?1:0} : p))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this datapad entry?')) return
    await api(`/api/datapads/${id}`, 'DELETE')
    setPads(ps => ps.filter(p => p.id !== id))
  }

  async function handleSave(id: string, title: string, content: string) {
    await api(`/api/datapads/${id}`, 'PATCH', { title, content })
    setPads(ps => ps.map(p => p.id===id ? {...p, title, content} : p))
  }

  return (
    <div style={{flex:1,overflowY:'auto',padding:20,background:'var(--bg)'}}>
      <div style={{maxWidth:820,margin:'0 auto'}}>

        {/* ── Page heading ── */}
        <div style={{marginBottom:24,display:'flex',alignItems:'baseline',gap:16}}>
          <h1 style={{fontFamily:'var(--display)',fontSize:28,fontWeight:700,
                      color:'var(--text-bright)',letterSpacing:'0.08em',
                      textTransform:'uppercase',margin:0}}>
            Datapads
          </h1>
          {isGm && (
            <span style={{fontFamily:'var(--mono)',fontSize:13,color:'var(--text-dim)'}}>
              GM — compose &amp; reveal messages to players
            </span>
          )}
        </div>

        {error && (
          <div style={{background:'rgba(192,57,43,0.15)',border:'1px solid var(--red)',
                       borderRadius:6,padding:'10px 14px',color:'var(--red)',
                       fontFamily:'var(--mono)',fontSize:15,marginBottom:16}}>
            {error}
          </div>
        )}

        {/* ── GM: New datapad form ── */}
        {isGm && (
          <div style={{background:'var(--panel)',border:'1px solid var(--border)',
                       borderRadius:8,padding:16,marginBottom:24}}>
            <div style={{fontFamily:'var(--mono)',fontSize:13,fontWeight:700,
                         color:'var(--text-dim)',textTransform:'uppercase',
                         letterSpacing:'0.1em',marginBottom:12}}>
              Compose New Datapad
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <input
                value={newTitle}
                onChange={e=>setNewTitle(e.target.value)}
                placeholder="Title / Subject"
                style={{background:'var(--panel2)',border:'1px solid var(--border)',borderRadius:6,
                        padding:'8px 10px',color:'var(--text)',fontFamily:'var(--display)',
                        fontSize:16,fontWeight:700,outline:'none'}}/>
              <textarea
                value={newContent}
                onChange={e=>setNewContent(e.target.value)}
                rows={5}
                placeholder="Write the message…"
                style={{background:'var(--panel2)',border:'1px solid var(--border)',borderRadius:6,
                        padding:'8px 10px',color:'var(--text)',fontFamily:'var(--body)',
                        fontSize:15,outline:'none',resize:'vertical',lineHeight:1.6}}/>
              <div style={{display:'flex',justifyContent:'flex-end'}}>
                <Btn variant="primary"
                  onClick={handleCreate}
                  style={saving || !newTitle.trim() ? {opacity:0.4,pointerEvents:'none'} : {}}>
                  {saving ? 'Saving…' : 'Create (Hidden)'}
                </Btn>
              </div>
            </div>
          </div>
        )}

        {/* ── List ── */}
        {loading ? (
          <div style={{textAlign:'center',padding:40,fontFamily:'var(--mono)',color:'var(--text-dim)'}}>
            Loading…
          </div>
        ) : pads.length === 0 ? (
          <div style={{textAlign:'center',padding:40,fontFamily:'var(--mono)',fontSize:15,color:'var(--text-dim)'}}>
            {isGm ? 'No datapads yet. Compose one above.' : 'No messages received.'}
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {pads.map(pad =>
              isGm ? (
                <GMDatapadCard
                  key={pad.id}
                  pad={pad}
                  onReveal={handleReveal}
                  onDelete={handleDelete}
                  onSave={handleSave}
                />
              ) : (
                <DatapadCard key={pad.id} pad={pad} />
              )
            )}
          </div>
        )}

      </div>
    </div>
  )
}
