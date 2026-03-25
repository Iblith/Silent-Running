'use client'
// app/(app)/datapad/page.tsx

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { api, Btn } from '@/lib/ui'

interface Datapad {
  id: string
  title: string
  content: string
  revealed: number
  created_at: string
}

export default function DatapadPage() {
  const { user } = useAuth()
  const isGm = user?.role === 'gm'

  const [pads,     setPads]     = useState<Datapad[]>([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState<string | null>(null)

  // Compose form (GM)
  const [composing,  setComposing]  = useState(false)
  const [newTitle,   setNewTitle]   = useState('')
  const [newContent, setNewContent] = useState('')
  const [saving,     setSaving]     = useState(false)

  // Edit state (GM)
  const [editing,     setEditing]     = useState(false)
  const [editTitle,   setEditTitle]   = useState('')
  const [editContent, setEditContent] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    api('/api/datapads')
      .then((data: Datapad[]) => { setPads(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const activePad = pads.find(p => p.id === selected) ?? null

  // When selected pad updates (e.g. reveal), sync edit fields
  useEffect(() => {
    if (activePad && editing) {
      // keep edit fields in sync if not currently dirty
    }
  }, [activePad])

  function selectPad(id: string) {
    setSelected(id)
    setEditing(false)
    const pad = pads.find(p => p.id === id)
    if (pad) { setEditTitle(pad.title); setEditContent(pad.content) }
  }

  async function handleCreate() {
    if (!newTitle.trim()) return
    setSaving(true)
    try {
      await api('/api/datapads', 'POST', { title: newTitle, content: newContent })
      setNewTitle(''); setNewContent(''); setComposing(false)
      load()
    } catch {}
    setSaving(false)
  }

  async function handleReveal(id: string, revealed: boolean) {
    await api(`/api/datapads/${id}`, 'PATCH', { revealed })
    setPads(ps => ps.map(p => p.id === id ? { ...p, revealed: revealed ? 1 : 0 } : p))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this datapad entry?')) return
    await api(`/api/datapads/${id}`, 'DELETE')
    setPads(ps => ps.filter(p => p.id !== id))
    setSelected(null)
  }

  async function handleSave(id: string) {
    await api(`/api/datapads/${id}`, 'PATCH', { title: editTitle, content: editContent })
    setPads(ps => ps.map(p => p.id === id ? { ...p, title: editTitle, content: editContent } : p))
    setEditing(false)
  }

  const inpStyle: React.CSSProperties = {
    background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,
    padding:'8px 10px',color:'var(--text)',fontFamily:'var(--body)',
    fontSize:15,outline:'none',width:'100%',boxSizing:'border-box',
  }

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',background:'var(--bg)'}}>

      {/* ── Top bar ── */}
      <div style={{flexShrink:0,padding:'12px 20px',borderBottom:'1px solid var(--border)',
                   display:'flex',alignItems:'center',gap:12,background:'var(--panel)'}}>
        <span style={{fontFamily:'var(--display)',fontSize:20,fontWeight:700,
                      color:'var(--text-bright)',letterSpacing:'0.1em',textTransform:'uppercase'}}>
          Datapads
        </span>
        {isGm && !composing && (
          <Btn variant="primary" onClick={()=>{ setComposing(true); setSelected(null) }}>
            + Compose
          </Btn>
        )}
        {isGm && composing && (
          <Btn variant="ghost" onClick={()=>setComposing(false)}>Cancel</Btn>
        )}
      </div>

      {/* ── Main split ── */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>

        {/* ── Inbox list ── */}
        <div style={{width:300,flexShrink:0,borderRight:'1px solid var(--border)',
                     overflowY:'auto',display:'flex',flexDirection:'column'}}>
          {loading && (
            <div style={{padding:24,textAlign:'center',fontFamily:'var(--mono)',
                         fontSize:14,color:'var(--text-dim)'}}>Loading…</div>
          )}
          {!loading && pads.length === 0 && (
            <div style={{padding:24,textAlign:'center',fontFamily:'var(--mono)',
                         fontSize:14,color:'var(--text-dim)'}}>
              {isGm ? 'No datapads yet.' : 'No messages received.'}
            </div>
          )}
          {pads.map(pad => {
            const isActive  = selected === pad.id
            const revealed  = !!pad.revealed
            const preview   = pad.content.replace(/\n/g,' ').slice(0, 60)
            return (
              <button key={pad.id} onClick={()=>selectPad(pad.id)}
                style={{
                  display:'block',width:'100%',textAlign:'left',padding:'12px 14px',
                  background: isActive ? 'rgba(212,172,13,0.08)' : 'transparent',
                  borderBottom:'1px solid var(--border)',
                  borderLeft: isActive ? '3px solid var(--gold)' : '3px solid transparent',
                  border:'none',borderBottom:'1px solid var(--border)',
                  borderLeft: isActive ? '3px solid var(--gold)' : '3px solid transparent',
                  cursor:'pointer',outline:'none',
                }}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                  {isGm && (
                    <span style={{
                      width:7,height:7,borderRadius:'50%',flexShrink:0,
                      background: revealed ? '#66bb6a' : 'rgba(255,255,255,0.2)',
                    }}/>
                  )}
                  <span style={{fontFamily:'var(--display)',fontSize:14,fontWeight:700,
                                color: isActive ? 'var(--gold)' : 'var(--text-bright)',
                                flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {pad.title || 'Untitled'}
                  </span>
                </div>
                {preview && (
                  <div style={{fontFamily:'var(--body)',fontSize:13,color:'var(--text-dim)',
                               overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
                               paddingLeft: isGm ? 13 : 0}}>
                    {preview}{pad.content.length > 60 ? '…' : ''}
                  </div>
                )}
                <div style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--text-dim)',
                             marginTop:4,paddingLeft: isGm ? 13 : 0}}>
                  {new Date(pad.created_at).toLocaleDateString()}
                </div>
              </button>
            )
          })}
        </div>

        {/* ── Detail / Compose pane ── */}
        <div style={{flex:1,overflowY:'auto',padding:24}}>

          {/* Compose form */}
          {composing && isGm && (
            <div style={{maxWidth:640}}>
              <div style={{fontFamily:'var(--mono)',fontSize:13,fontWeight:700,
                           color:'var(--text-dim)',textTransform:'uppercase',
                           letterSpacing:'0.1em',marginBottom:14}}>
                New Datapad Entry
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                <input value={newTitle} onChange={e=>setNewTitle(e.target.value)}
                  placeholder="Title / Subject"
                  style={{...inpStyle,fontFamily:'var(--display)',fontSize:17,fontWeight:700}}/>
                <textarea value={newContent} onChange={e=>setNewContent(e.target.value)}
                  rows={10} placeholder="Write the message…"
                  style={{...inpStyle,resize:'vertical',lineHeight:1.7}}/>
                <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                  <Btn variant="ghost" onClick={()=>setComposing(false)}>Cancel</Btn>
                  <Btn variant="primary"
                    onClick={handleCreate}
                    style={saving || !newTitle.trim() ? {opacity:0.4,pointerEvents:'none'} : {}}>
                    {saving ? 'Saving…' : 'Create (Hidden)'}
                  </Btn>
                </div>
              </div>
            </div>
          )}

          {/* No selection */}
          {!composing && !activePad && (
            <div style={{height:'100%',display:'flex',alignItems:'center',justifyContent:'center',
                         fontFamily:'var(--mono)',fontSize:14,color:'var(--text-dim)'}}>
              Select a message to read
            </div>
          )}

          {/* Selected message */}
          {!composing && activePad && (() => {
            const revealed = !!activePad.revealed
            return (
              <div style={{maxWidth:640}}>
                {/* Terminal header */}
                <div style={{
                  background: revealed ? 'rgba(74,166,90,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${revealed ? 'rgba(74,166,90,0.3)' : 'var(--border)'}`,
                  borderRadius:'8px 8px 0 0',
                  padding:'8px 14px',
                  display:'flex',alignItems:'center',gap:10,
                }}>
                  <span style={{
                    fontFamily:'var(--mono)',fontSize:12,letterSpacing:'0.1em',
                    color: revealed ? '#66bb6a' : 'var(--text-dim)',
                    background: revealed ? 'rgba(74,166,90,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${revealed ? 'rgba(74,166,90,0.3)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius:3,padding:'2px 8px',
                  }}>
                    {revealed ? '● REVEALED' : '○ HIDDEN'}
                  </span>
                  <span style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--text-dim)',marginLeft:'auto'}}>
                    {new Date(activePad.created_at).toLocaleString()}
                  </span>
                </div>

                {/* Body */}
                <div style={{
                  background:'var(--panel)',
                  border:`1px solid ${revealed ? 'rgba(74,166,90,0.3)' : 'var(--border)'}`,
                  borderTop:'none',borderRadius:'0 0 8px 8px',
                  padding:'18px 20px',
                }}>
                  {editing ? (
                    <div style={{display:'flex',flexDirection:'column',gap:10}}>
                      <input value={editTitle} onChange={e=>setEditTitle(e.target.value)}
                        style={{...inpStyle,fontFamily:'var(--display)',fontSize:20,fontWeight:700}}/>
                      <textarea value={editContent} onChange={e=>setEditContent(e.target.value)}
                        rows={12} style={{...inpStyle,resize:'vertical',lineHeight:1.7}}/>
                      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                        <Btn variant="ghost" onClick={()=>setEditing(false)}>Cancel</Btn>
                        <Btn variant="primary" onClick={()=>handleSave(activePad.id)}>Save</Btn>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{fontFamily:'var(--display)',fontSize:22,fontWeight:700,
                                   color:'var(--text-bright)',marginBottom:14}}>
                        {activePad.title}
                      </div>
                      <div style={{fontFamily:'var(--body)',fontSize:15,color:'var(--text)',
                                   lineHeight:1.75,whiteSpace:'pre-wrap',marginBottom: isGm ? 20 : 0}}>
                        {activePad.content ||
                          <span style={{color:'var(--text-dim)',fontStyle:'italic'}}>No content.</span>}
                      </div>
                      {isGm && (
                        <div style={{display:'flex',gap:8,flexWrap:'wrap',
                                     borderTop:'1px solid var(--border)',paddingTop:14}}>
                          <Btn variant={revealed ? 'ghost' : 'primary'}
                            onClick={()=>handleReveal(activePad.id, !revealed)}>
                            {revealed ? 'Hide from players' : 'Reveal to players'}
                          </Btn>
                          <Btn variant="ghost" onClick={()=>{ setEditing(true) }}>Edit</Btn>
                          <Btn variant="danger" onClick={()=>handleDelete(activePad.id)}>Delete</Btn>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })()}

        </div>
      </div>
    </div>
  )
}
