'use client'
// app/(app)/gm/page.tsx

import React, { useState, useEffect } from 'react'
import { api, useDebounce, useIsMobile, SBtn, Btn, GmCard, RV, rollDice } from '@/lib/ui'
import { INITIAL_CAMPAIGN, CREW_CRIT, SHIP_CRIT } from '@/lib/gameData'

// ─────────────────────────────────────────────────────────────────────────────
// PLAYER ACCOUNTS CARD
// ─────────────────────────────────────────────────────────────────────────────
function PlayerAccountsCard() {
  const [users,    setUsers]    = useState<any[]>([])
  const [chars,    setChars]    = useState<any[]>([])
  const [form,     setForm]     = useState({username:'',password:'',characterId:''})
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(true)
  // pending char assignments: userId -> characterId (string)
  const [pending,  setPending]  = useState<Record<string,string>>({})
  const [saving,   setSaving]   = useState<Record<string,boolean>>({})

  useEffect(() => {
    Promise.all([api('/api/auth/users'), api('/api/characters')])
      .then(([u,c]) => { setUsers(u); setChars(c); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function createUser() {
    if (!form.username || !form.password) { setError('Username and password required'); return }
    setError('')
    try {
      await api('/api/auth/users','POST',{...form, role:'player'})
      const u = await api('/api/auth/users')
      setUsers(u)
      setForm({username:'',password:'',characterId:''})
    } catch (e: any) { setError(e.message) }
  }

  async function deleteUser(id: string) {
    await api(`/api/auth/users/${id}`,'DELETE')
    setUsers(u=>u.filter((x:any)=>x.id!==id))
    setPending(p=>{ const n={...p}; delete n[id]; return n })
  }

  async function confirmLink(userId: string) {
    const characterId = pending[userId] ?? ''
    setSaving(s=>({...s,[userId]:true}))
    try {
      await api(`/api/auth/users/${userId}`,'PATCH',{characterId})
      setUsers(u=>u.map((x:any)=>x.id===userId?{...x,character_id:characterId}:x))
      setPending(p=>{ const n={...p}; delete n[userId]; return n })
    } finally {
      setSaving(s=>({...s,[userId]:false}))
    }
  }

  if (loading) return <div style={{padding:12,color:'var(--text-dim)',fontFamily:'var(--mono)',fontSize:16}}>Loading…</div>

  return (
    <div>
      {users.filter((u:any)=>u.role==='player').length===0 && (
        <div style={{fontFamily:'var(--mono)',fontSize:16,color:'var(--text-dim)',marginBottom:12}}>No player accounts yet.</div>
      )}
      {users.filter((u:any)=>u.role==='player').map((u:any) => {
        const hasPending = u.id in pending && pending[u.id] !== (u.character_id||'')
        const selectVal  = u.id in pending ? pending[u.id] : (u.character_id||'')
        return (
          <div key={u.id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 0',
                                  borderBottom:'1px solid rgba(255,255,255,0.05)',flexWrap:'wrap'}}>
            <span style={{fontFamily:'var(--mono)',fontSize:15,color:'var(--text-bright)',flex:'0 0 100px'}}>{u.username}</span>
            <select value={selectVal}
              onChange={e=>setPending(p=>({...p,[u.id]:e.target.value}))}
              style={{flex:1,minWidth:120,background:'var(--bg3)',
                      border:`1px solid ${hasPending ? 'rgba(212,172,13,0.5)' : 'var(--border)'}`,
                      borderRadius:4,padding:'4px 6px',color:'var(--text)',fontFamily:'var(--mono)',fontSize:16}}>
              <option value=''>— no character —</option>
              {chars.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {hasPending && (
              <button onClick={()=>confirmLink(u.id)} disabled={saving[u.id]}
                style={{padding:'4px 12px',borderRadius:4,border:'1px solid rgba(212,172,13,0.5)',
                        background:'rgba(212,172,13,0.12)',color:'var(--gold)',fontFamily:'var(--display)',
                        fontSize:14,fontWeight:700,letterSpacing:'0.06em',cursor:'pointer',
                        opacity:saving[u.id]?0.5:1,flexShrink:0}}>
                {saving[u.id] ? '…' : 'Confirm'}
              </button>
            )}
            <button onClick={()=>deleteUser(u.id)}
              style={{background:'none',border:'none',color:'var(--red)',fontSize:17,cursor:'pointer',flexShrink:0}}>×</button>
          </div>
        )
      })}
      <div style={{marginTop:14,display:'flex',gap:8,flexWrap:'wrap',alignItems:'flex-end'}}>
        <input placeholder="username" value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))}
          style={{flex:'1 1 90px',minWidth:80,background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:4,
                  padding:'6px 8px',color:'var(--text)',fontFamily:'var(--mono)',fontSize:16}}/>
        <input placeholder="password" type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}
          style={{flex:'1 1 90px',minWidth:80,background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:4,
                  padding:'6px 8px',color:'var(--text)',fontFamily:'var(--mono)',fontSize:16}}/>
        <select value={form.characterId} onChange={e=>setForm(f=>({...f,characterId:e.target.value}))}
          style={{flex:'1 1 110px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:4,
                  padding:'6px 8px',color:'var(--text)',fontFamily:'var(--mono)',fontSize:16}}>
          <option value=''>— no character —</option>
          {chars.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={createUser}
          style={{padding:'6px 14px',borderRadius:4,border:'1px solid rgba(212,172,13,0.4)',
                  background:'rgba(212,172,13,0.1)',color:'var(--gold)',fontFamily:'var(--display)',
                  fontSize:16,fontWeight:700,letterSpacing:'0.08em',cursor:'pointer'}}>Add Player</button>
      </div>
      {error && <div style={{marginTop:8,fontFamily:'var(--mono)',fontSize:16,color:'var(--red)'}}>{error}</div>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CRITICAL INJURY / HIT CARD
// ─────────────────────────────────────────────────────────────────────────────
function CritInjuryCard({ title, injuries, table, isShip, col, onAdd, onRemove }:
  { title:string; injuries:any[]; table:typeof CREW_CRIT; isShip:boolean; col?:number;
    onAdd:(inj:any)=>void; onRemove:(id:string)=>void }) {
  const [roll,      setRoll]      = useState('')
  const [character, setCharacter] = useState('')
  const [showTable, setShowTable] = useState(false)

  const rollNum = parseInt(roll)
  const preview = !isNaN(rollNum) && rollNum > 0
    ? (table.find(c => rollNum >= c.lo && rollNum <= c.hi) ?? table[table.length-1])
    : null

  const sevColor = (s:number) =>
    s >= 4 ? '#922B21' : s >= 3 ? 'var(--red)' : s >= 2 ? '#D35400' : '#E67E22'

  const canAdd = !!preview && (isShip || character.trim().length > 0)

  return (
    <GmCard title={title} col={col??1}>
      <div style={{display:'flex',gap:6,marginBottom:8,flexWrap:'wrap',alignItems:'center'}}>
        {!isShip && (
          <input value={character} onChange={e=>setCharacter(e.target.value)} placeholder="Character name"
            style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:4,padding:'5px 9px',
                    color:'var(--text)',fontFamily:'var(--mono)',fontSize:16,flex:1,minWidth:90,outline:'none'}}/>
        )}
        <input value={roll} onChange={e=>setRoll(e.target.value)} placeholder="d100" type="number" min={1} max={999}
          style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:4,padding:'5px 9px',
                  color:'var(--text)',fontFamily:'var(--mono)',fontSize:16,width:80,outline:'none'}}/>
        <button onClick={()=>setRoll(String(Math.floor(Math.random()*100)+1))}
          style={{padding:'5px 11px',borderRadius:4,border:'1px solid var(--border2)',background:'var(--panel)',
                  color:'var(--text-dim)',fontFamily:'var(--mono)',fontSize:16,cursor:'pointer'}}>
          Roll
        </button>
        <button disabled={!canAdd} onClick={()=>{
            if (!preview || (!isShip && !character.trim())) return
            onAdd({id:Date.now().toString(),...(!isShip?{character}:{}),roll:rollNum,...preview})
            setRoll(''); setCharacter('')
          }}
          style={{padding:'5px 11px',borderRadius:4,
                  border:`1px solid ${canAdd?'rgba(212,172,13,0.5)':'var(--border)'}`,
                  background:canAdd?'rgba(212,172,13,0.1)':'var(--panel)',
                  color:canAdd?'var(--gold)':'var(--text-dim)',
                  fontFamily:'var(--display)',fontSize:16,fontWeight:700,cursor:canAdd?'pointer':'default'}}>
          Add
        </button>
      </div>
      {preview && (
        <div style={{marginBottom:10,padding:'7px 11px',borderRadius:4,
                     background:sevColor(preview.sev)+'22',border:`1px solid ${sevColor(preview.sev)}55`}}>
          <span style={{color:sevColor(preview.sev),fontFamily:'var(--display)',fontWeight:700,fontSize:15}}>
            {preview.name}{' '}
          </span>
          <span style={{color:'var(--text-dim)',fontFamily:'var(--mono)',fontSize:15}}>{preview.eff}</span>
        </div>
      )}
      {injuries.length === 0 ? (
        <div style={{color:'var(--text-dim)',fontFamily:'var(--mono)',fontSize:16,
                     textAlign:'center',padding:'12px 0',borderTop:'1px solid var(--border)'}}>
          No active {isShip ? 'critical hits' : 'critical injuries'}
        </div>
      ) : injuries.map((inj:any) => (
        <div key={inj.id} style={{display:'flex',gap:8,alignItems:'flex-start',padding:'7px 9px',
                                   marginBottom:5,background:'rgba(255,255,255,0.02)',
                                   border:'1px solid var(--border)',borderRadius:5}}>
          {!isShip && (
            <span style={{color:'var(--gold)',fontFamily:'var(--display)',fontSize:16,
                          flexShrink:0,minWidth:70,paddingTop:1}}>{inj.character}</span>
          )}
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:sevColor(inj.sev),fontFamily:'var(--display)',fontWeight:600,fontSize:16}}>
              {inj.name}
            </div>
            <div style={{color:'var(--text-dim)',fontFamily:'var(--mono)',fontSize:15,lineHeight:1.4}}>
              {inj.eff}
            </div>
          </div>
          <button onClick={()=>onRemove(inj.id)}
            style={{background:'none',border:'none',color:'var(--text-dim)',
                    fontSize:19,cursor:'pointer',lineHeight:1,flexShrink:0,paddingTop:0}}>
            ×
          </button>
        </div>
      ))}
      <button onClick={()=>setShowTable(s=>!s)}
        style={{marginTop:8,width:'100%',padding:'5px',borderRadius:4,border:'1px solid var(--border)',
                background:'none',color:'var(--text-dim)',fontFamily:'var(--mono)',fontSize:15,cursor:'pointer'}}>
        {showTable ? 'Hide' : 'Show'} Reference Table
      </button>
      {showTable && (
        <div style={{marginTop:6,maxHeight:280,overflowY:'auto',border:'1px solid var(--border)',borderRadius:4}}>
          {table.map((row,i) => (
            <div key={i} style={{display:'flex',gap:8,padding:'4px 9px',alignItems:'baseline',
                                  borderBottom:i<table.length-1?'1px solid rgba(255,255,255,0.04)':'none',
                                  background:i%2===0?'rgba(255,255,255,0.01)':'transparent'}}>
              <span style={{fontFamily:'var(--mono)',fontSize:14,color:'var(--text-dim)',
                            minWidth:58,flexShrink:0}}>
                {row.lo}{row.lo!==row.hi?`–${row.hi}`:''}
              </span>
              <span style={{fontFamily:'var(--display)',fontWeight:600,fontSize:15,
                            color:sevColor(row.sev),minWidth:130,flexShrink:0}}>
                {row.name}
              </span>
              <span style={{fontFamily:'var(--mono)',fontSize:14,color:'var(--text-dim)',flex:1}}>
                {row.eff}
              </span>
            </div>
          ))}
        </div>
      )}
    </GmCard>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GM DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function GMDashboard() {
  const [state, setState] = useState<any>(INITIAL_CAMPAIGN)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const debounced = useDebounce(state, 1000)

  useEffect(()=>{
    api('/api/campaign').then(d=>{setState(d);setLoading(false)}).catch(()=>setLoading(false))
  },[])

  useEffect(()=>{
    if(loading) return
    setSaving(true)
    api('/api/campaign','PUT',debounced).finally(()=>setSaving(false))
  },[debounced])

  const upd = (k:string,v:any) => {
    setState((s:any)=>({...s,[k]:v}))
    if (k === 'campaignName') window.dispatchEvent(new CustomEvent('campaignNameChange', {detail: v}))
  }

  const isMobile = useIsMobile()

  const duty: number         = state.duty ?? 0
  const tier: number         = state.tier ?? 1
  const crewCriticals: any[] = state.crewCriticals ?? []
  const shipCriticals: any[] = state.shipCriticals ?? []
  const dutyThresholdMet     = duty >= 100

  if(loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'var(--text-dim)',fontFamily:'var(--mono)'}}>
      Loading campaign data…
    </div>
  )

  return (
    <div style={{height:'100%',overflowY:'auto',padding:20,position:'relative'}}>
      {saving && (
        <div style={{position:'fixed',top:60,right:16,background:'rgba(212,172,13,0.15)',
                     border:'1px solid rgba(212,172,13,0.4)',borderRadius:6,padding:'6px 12px',
                     fontSize:16,color:'var(--gold)',fontFamily:'var(--mono)',zIndex:99}}>
          Saving…
        </div>
      )}
      {/* Campaign name */}
      <div style={{maxWidth:1200,margin:'0 auto 16px',background:'var(--panel)',
                   border:'1px solid var(--border)',borderRadius:8,padding:'14px 18px',
                   display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
        <span style={{fontFamily:'var(--mono)',fontSize:15,color:'var(--text-dim)',
                      textTransform:'uppercase',letterSpacing:'0.1em',whiteSpace:'nowrap'}}>
          Campaign Name
        </span>
        <input
          value={state.campaignName||''}
          onChange={(e:any)=>upd('campaignName',e.target.value)}
          style={{flex:1,minWidth:isMobile?100:220,background:'var(--bg2)',border:'1px solid var(--border2)',
                  borderRadius:4,padding:'7px 12px',color:'var(--text-bright)',
                  fontFamily:'var(--display)',fontSize:19,fontWeight:700,
                  letterSpacing:'0.08em',textTransform:'uppercase',outline:'none'}}
        />
        {!isMobile && (
          <span style={{fontFamily:'var(--mono)',fontSize:14,color:'var(--text-dim)'}}>
            Updates top bar &amp; browser tab
          </span>
        )}
      </div>

      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)',gap:16,maxWidth:1200,margin:'0 auto'}}>

        {/* Heat Track */}
        <GmCard title="Heat Track">
          <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:10}}>
            {Array.from({length:10}).map((_,i)=>{
              const on=i<state.heatLevel
              const bg=on?(i>=7?'var(--red)':'#E67E22'):'rgba(255,255,255,0.04)'
              return (
                <div key={i} onClick={()=>upd('heatLevel',state.heatLevel===i+1?i:i+1)}
                  style={{width:26,height:26,borderRadius:4,border:'1px solid var(--border2)',cursor:'pointer',
                          background:bg,display:'flex',alignItems:'center',justifyContent:'center',
                          fontFamily:'var(--mono)',fontSize:15,color:on?'white':'transparent',
                          boxShadow:on?`0 0 6px ${i>=7?'rgba(192,57,43,0.4)':'rgba(230,126,34,0.4)'}`:''}}>{i+1}</div>
              )
            })}
          </div>
          {[['1–2','Cold — Normal operations'],['3–4','Warm — Checkpoints tighten'],
            ['5–6','Hot — Renaus hunting'],['7–8','Burning — ISB active'],['9–10','Inferno — Full manhunt']].map(([r,e])=>(
            <div key={r} style={{display:'flex',gap:8,marginBottom:5,alignItems:'center'}}>
              <span style={{fontFamily:'var(--mono)',fontSize:15,color:'var(--red)',minWidth:32}}>{r}</span>
              <span style={{fontSize:16,color:'var(--text-dim)'}}>{e}</span>
            </div>
          ))}
          <div style={{marginTop:12,paddingTop:12,borderTop:'1px solid var(--border)'}}>
            <div style={{fontFamily:'var(--display)',fontSize:16,fontWeight:700,letterSpacing:'0.08em',
                         textTransform:'uppercase',color:'var(--gold)',marginBottom:8}}>Renaus Track</div>
            <div style={{display:'flex',gap:6}}>
              {Array.from({length:5}).map((_,i)=>(
                <div key={i} onClick={()=>upd('renausTrack',state.renausTrack===i+1?i:i+1)}
                  style={{width:34,height:34,borderRadius:4,border:'1px solid var(--border2)',cursor:'pointer',
                          background:i<state.renausTrack?'#FF9800':'rgba(255,255,255,0.04)',
                          display:'flex',alignItems:'center',justifyContent:'center',
                          fontSize:15,fontFamily:'var(--mono)',color:i<state.renausTrack?'white':'transparent',
                          boxShadow:i<state.renausTrack?'0 0 6px rgba(255,152,0,0.4)':''}}>□{i+1}</div>
              ))}
            </div>
            <div style={{fontSize:15,color:'var(--text-dim)',fontFamily:'var(--mono)',marginTop:6,lineHeight:1.6}}>
              □3 = Active hunt  □4 = Profile known  □5 = Full manhunt
            </div>
          </div>
        </GmCard>

        {/* Moral Ledger */}
        <GmCard title="Moral Ledger">
          {([['MERCY','mercyCount','var(--green-bright)'],
             ['EXPEDIENCY','expedCount','var(--red)']] as [string,string,string][]).map(([lbl,key,col])=>(
            <div key={key} style={{marginBottom:14}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                <span style={{fontSize:15,color:col,minWidth:90,fontFamily:'var(--display)',fontWeight:600}}>{lbl}</span>
                <span style={{fontFamily:'var(--mono)',fontSize:15,color:col,marginLeft:'auto'}}>{(state as any)[key]}</span>
              </div>
              <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                {Array.from({length:10}).map((_,i)=>(
                  <div key={i} onClick={()=>upd(key,(state as any)[key]===i+1?i:i+1)}
                    style={{width:20,height:20,borderRadius:3,border:'1px solid var(--border2)',cursor:'pointer',
                            background:i<(state as any)[key]?col:'rgba(255,255,255,0.04)',
                            boxShadow:i<(state as any)[key]?`0 0 4px ${col}66`:'',transition:'all 0.15s'}}/>
                ))}
              </div>
            </div>
          ))}
          {(()=>{
            const d=state.mercyCount-state.expedCount
            const txt=d>=3?'Ewoks ally. Verath hesitates.':d<=-3?'No Ewoks. Verath does not hesitate.':'Ewoks cautious. Triumph for Verath hesitation.'
            const col=d>=3?'var(--green-bright)':d<=-3?'var(--red)':'var(--gold)'
            return (
              <div style={{background:'var(--bg3)',border:`1px solid ${col}40`,borderRadius:6,padding:10,marginTop:4}}>
                <div style={{fontSize:14,fontFamily:'var(--mono)',color:'var(--text-dim)',marginBottom:4,
                             textTransform:'uppercase',letterSpacing:'0.08em'}}>Act III Outcome</div>
                <div style={{fontSize:16,color:col,lineHeight:1.5}}>{txt}</div>
              </div>
            )
          })()}
        </GmCard>

        {/* Duty Tracker */}
        <GmCard title="Duty Tracker">
          <div style={{textAlign:'center',marginBottom:12}}>
            <div style={{fontFamily:'var(--display)',fontSize:54,fontWeight:700,color:'var(--gold)',lineHeight:1}}>
              {duty}
            </div>
            <div style={{fontFamily:'var(--mono)',fontSize:15,color:'var(--text-dim)',marginTop:3}}>
              / 100 threshold
            </div>
            <div style={{background:'rgba(255,255,255,0.06)',borderRadius:4,height:5,margin:'8px 0 4px',overflow:'hidden'}}>
              <div style={{height:'100%',borderRadius:4,transition:'width 0.4s',
                           width:`${Math.min(100,(duty/100)*100)}%`,
                           background:dutyThresholdMet?'var(--green-bright)':'var(--gold)'}}/>
            </div>
            {dutyThresholdMet && (
              <div style={{marginTop:6,padding:'4px 10px',background:'rgba(39,174,96,0.15)',
                           border:'1px solid var(--green-bright)',borderRadius:4,display:'inline-block',
                           color:'var(--green-bright)',fontFamily:'var(--mono)',fontSize:15,
                           fontWeight:700,letterSpacing:'0.1em'}}>
                ✓ THRESHOLD MET
              </div>
            )}
          </div>
          <div style={{display:'flex',gap:5,justifyContent:'center',flexWrap:'wrap',marginBottom:10}}>
            {([1,5,10,-1,-5] as number[]).map(n=>(
              <button key={n} onClick={()=>upd('duty',Math.max(0,duty+n))}
                style={{padding:'4px 10px',borderRadius:4,fontFamily:'var(--mono)',fontSize:16,cursor:'pointer',
                        border:`1px solid ${n>0?'rgba(212,172,13,0.4)':'rgba(192,57,43,0.4)'}`,
                        background:n>0?'rgba(212,172,13,0.08)':'rgba(192,57,43,0.08)',
                        color:n>0?'var(--gold)':'var(--red)'}}>
                {n>0?`+${n}`:n}
              </button>
            ))}
          </div>
          {dutyThresholdMet && (
            <button onClick={()=>setState((s:any)=>({...s,duty:Math.max(0,(s.duty??0)-100),tier:(s.tier??1)+1}))}
              style={{width:'100%',padding:'9px',borderRadius:5,border:'1px solid var(--green-bright)',
                      background:'rgba(39,174,96,0.15)',color:'var(--green-bright)',
                      fontFamily:'var(--display)',fontSize:15,fontWeight:700,
                      letterSpacing:'0.08em',cursor:'pointer',marginBottom:10}}>
              SPEND DUTY — Advance to Tier {tier + 1}
            </button>
          )}
          <div style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:5,
                       padding:'8px 12px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <div style={{fontSize:14,fontFamily:'var(--mono)',color:'var(--text-dim)',
                           textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:2}}>Current Tier</div>
              <div style={{fontFamily:'var(--display)',fontSize:30,fontWeight:700,color:'var(--text-bright)',lineHeight:1}}>
                {tier}
              </div>
            </div>
            <div style={{display:'flex',gap:5}}>
              <SBtn onClick={()=>upd('tier',Math.max(1,tier-1))}>−</SBtn>
              <SBtn onClick={()=>upd('tier',tier+1)}>+</SBtn>
            </div>
          </div>
        </GmCard>

        {/* GM Notes */}
        <GmCard title={`GM Notes — Session ${state.session ?? 1}`} col={2}>
          <div style={{display:'flex',gap:6,marginBottom:8,alignItems:'center'}}>
            <div style={{fontSize:15,fontFamily:'var(--mono)',color:'var(--text-dim)'}}>Session</div>
            <SBtn onClick={()=>upd('session',Math.max(1,(state.session??1)-1))}>−</SBtn>
            <div style={{fontFamily:'var(--display)',fontSize:21,fontWeight:700,color:'var(--gold)',minWidth:24,textAlign:'center'}}>
              {state.session ?? 1}
            </div>
            <SBtn onClick={()=>upd('session',(state.session??1)+1)}>+</SBtn>
          </div>
          <textarea value={state.gmNotes||''} onChange={(e:any)=>upd('gmNotes',e.target.value)}
            style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:6,
                    padding:10,color:'var(--text)',fontFamily:'var(--body)',fontSize:15,
                    resize:'vertical',outline:'none',minHeight:140,lineHeight:1.6}}
            placeholder="Session notes, NPC states, ongoing threads, player decisions to remember..."/>
        </GmCard>

        {/* Player Accounts */}
        <GmCard title="Player Accounts">
          <PlayerAccountsCard/>
        </GmCard>

        {/* Critical Injuries — Crew */}
        <CritInjuryCard
          title="Critical Injuries — Crew"
          injuries={crewCriticals}
          table={CREW_CRIT}
          isShip={false}
          col={2}
          onAdd={(inj:any)=>upd('crewCriticals',[...crewCriticals,inj])}
          onRemove={(id:string)=>upd('crewCriticals',crewCriticals.filter((c:any)=>c.id!==id))}
        />

        {/* Critical Hits — Ship */}
        <CritInjuryCard
          title="Critical Hits — Ship"
          injuries={shipCriticals}
          table={SHIP_CRIT}
          isShip={true}
          col={1}
          onAdd={(inj:any)=>upd('shipCriticals',[...shipCriticals,inj])}
          onRemove={(id:string)=>upd('shipCriticals',shipCriticals.filter((c:any)=>c.id!==id))}
        />

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIATIVE TRACKER
// ─────────────────────────────────────────────────────────────────────────────
function InitiativeTracker() {
  const [data,    setData]    = useState<any>({round:1,currentIdx:0,slots:[],log:[]})
  const [chars,   setChars]   = useState<any[]>([])
  const [form,    setForm]    = useState({name:'',type:'player',wt:12,st:12,charId:''})
  const [pool,    setPool]    = useState({ability:0,proficiency:0,difficulty:0,challenge:0,boost:0,setback:0})
  const [result,  setResult]  = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadData = () => api('/api/initiative').then(d=>setData(d))

  useEffect(() => {
    Promise.all([api('/api/initiative'),api('/api/characters')])
      .then(([init,ch])=>{setData(init);setChars(ch);setLoading(false)})
      .catch(()=>setLoading(false))
  },[])

  async function act(body: any) { await api('/api/initiative','PUT',body); await loadData() }

  async function addCombatant() {
    if(!form.name.trim()) return
    const linked = chars.find(c=>c.id===form.charId)
    await act({action:'add_slot', slot:{
      id:  crypto.randomUUID(), name: form.name, type: form.type,
      wt:  linked ? linked.characteristics.Brawn + linked.woundThreshold   : Number(form.wt)||12,
      st:  linked ? linked.characteristics.Willpower + linked.strainThreshold : Number(form.st)||12,
      charId: form.charId,
    }})
    setForm({name:'',type:'player',wt:12,st:12,charId:''})
  }

  async function wound(slot:any, field:'wounds'|'strain', delta:number) {
    const max = field==='wounds' ? slot.wt : slot.st
    const val = Math.max(0,Math.min(max,(slot[field]||0)+delta))
    await act({action:'update_slot',id:slot.id,
               wounds: field==='wounds'?val:slot.wounds,
               strain: field==='strain'?val:slot.strain,
               crits: slot.crits, used: slot.used})
  }

  async function addCrit(slot:any) {
    await act({action:'update_slot',id:slot.id,wounds:slot.wounds,strain:slot.strain,
               crits:[...(slot.crits||[]),Math.floor(Math.random()*100)+1],used:slot.used})
  }

  function roll() {
    const r = rollDice(pool); setResult(r)
    const parts:string[]=[]
    if(r.s>0)  parts.push(`${r.s} Success`)
    if(r.f>0)  parts.push(`${r.f} Failure`)
    if(r.a>0)  parts.push(`${r.a} Advantage`)
    if(r.th>0) parts.push(`${r.th} Threat`)
    if(r.t>0)  parts.push(`TRIUMPH`)
    if(r.d>0)  parts.push(`DESPAIR`)
    act({action:'add_log', message:`Roll: ${parts.join(', ')||'No result'}`,
         type: r.t>0?'important':r.d>0?'danger':''})
  }

  const DIE_BTNS = [
    {key:'ability',     label:'Ability',     col:'#4CAF50'},
    {key:'proficiency', label:'Proficiency', col:'#FFD700'},
    {key:'difficulty',  label:'Difficulty',  col:'#9B59B6'},
    {key:'challenge',   label:'Challenge',   col:'var(--red)'},
    {key:'boost',       label:'Boost',       col:'var(--cyan)'},
    {key:'setback',     label:'Setback',     col:'#78909C'},
  ]

  const isMobile = useIsMobile()

  if(loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'var(--text-dim)',fontFamily:'var(--mono)'}}>Loading…</div>

  return (
    <div style={{height:'100%',display: isMobile ? 'flex' : 'grid', flexDirection: isMobile ? 'column' : undefined, gridTemplateColumns: isMobile ? undefined : '1fr 360px', overflow: isMobile ? 'auto' : 'hidden'}}>
      {/* Main combat area */}
      <div style={{padding:16,overflowY:'auto',display:'flex',flexDirection:'column',gap:12}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontFamily:'var(--display)',fontSize:25,fontWeight:700,color:'var(--text-bright)',letterSpacing:'0.06em'}}>
            Initiative Order
          </div>
          <div style={{display:'flex',gap:8}}>
            <Btn onClick={()=>act({action:'reset'})}>Reset</Btn>
            <Btn variant="success" onClick={()=>act({action:'advance'})}>Next Turn ▶</Btn>
          </div>
        </div>

        <div style={{display:'flex',alignItems:'center',gap:16,padding:'12px 16px',
                     background:'var(--panel)',border:'1px solid var(--border)',borderRadius:8}}>
          <div>
            <div style={{fontFamily:'var(--mono)',fontSize:15,color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.1em'}}>Round</div>
            <div style={{fontFamily:'var(--display)',fontSize:39,fontWeight:700,color:'var(--gold)',lineHeight:1}}>{data.round}</div>
          </div>
          <div style={{width:1,background:'var(--border)',alignSelf:'stretch'}}/>
          <div>
            <div style={{fontFamily:'var(--mono)',fontSize:15,color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.1em'}}>Active</div>
            <div style={{fontFamily:'var(--display)',fontSize:18,fontWeight:600,color:'var(--text-bright)'}}>
              {data.slots[data.currentIdx]?.name||'—'}
            </div>
          </div>
          <div style={{width:1,background:'var(--border)',alignSelf:'stretch'}}/>
          <div>
            <div style={{fontFamily:'var(--mono)',fontSize:15,color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.1em'}}>Combatants</div>
            <div style={{fontFamily:'var(--display)',fontSize:25,fontWeight:700,color:'var(--text-bright)'}}>{data.slots.length}</div>
          </div>
        </div>

        {data.slots.length===0 && (
          <div style={{textAlign:'center',padding:'40px',color:'var(--text-dim)',fontFamily:'var(--mono)',fontSize:15}}>
            No combatants. Add them {isMobile ? 'below.' : 'from the right panel.'}
          </div>
        )}

        {data.slots.map((slot:any, idx:number) => {
          const cur = idx===data.currentIdx
          const accent = slot.type==='player'?'var(--gold)':slot.type==='enemy'?'var(--red)':'var(--blue-bright)'
          return (
            <div key={slot.id} style={{display:'flex',
                                       flexDirection: isMobile ? 'column' : 'row',
                                       alignItems: isMobile ? 'stretch' : 'center',
                                       gap: isMobile ? 8 : 12,
                                       padding:'10px 14px',
                                       background:cur?`${accent}0D`:'var(--panel)',
                                       border:`1px solid ${cur?accent:'var(--border)'}`,borderRadius:6,
                                       transition:'all 0.2s',opacity:slot.used&&!cur?0.5:1,
                                       boxShadow:cur?`0 0 12px ${accent}1A`:'none',
                                       position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',left:0,top:0,bottom:0,width:3,background:accent}}/>
              {/* Row 1: number, type, name, action buttons */}
              <div style={{display:'flex',alignItems:'center',gap: isMobile ? 8 : 12, flex: isMobile ? undefined : 1}}>
                <div style={{fontFamily:'var(--mono)',fontSize:19,fontWeight:700,
                             color:cur?accent:'var(--text-dim)',minWidth:26}}>{idx+1}</div>
                <span style={{padding:'2px 7px',borderRadius:3,fontSize:14,fontFamily:'var(--mono)',
                              textTransform:'uppercase',letterSpacing:'0.1em',
                              background:`${accent}33`,color:accent}}>{slot.type.toUpperCase()}</span>
                <div style={{fontFamily:'var(--display)',fontSize:17,fontWeight:600,color:'var(--text-bright)',flex:1}}>{slot.name}</div>
                <div style={{display:'flex',gap:4}}>
                  <button onClick={()=>addCrit(slot)} title="Add Critical"
                    style={{width:27,height:27,borderRadius:4,border:'1px solid var(--border)',
                            background:'rgba(255,255,255,0.04)',color:'var(--text-dim)',cursor:'pointer',
                            display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>⚡</button>
                  <button onClick={()=>act({action:'remove_slot',id:slot.id})}
                    style={{width:27,height:27,borderRadius:4,border:'1px solid var(--border)',
                            background:'rgba(255,255,255,0.04)',color:'var(--red)',cursor:'pointer',
                            display:'flex',alignItems:'center',justifyContent:'center',fontSize:17}}>×</button>
                </div>
              </div>
              {/* Row 2: wound/strain dots + crit badge */}
              <div style={{display:'flex',alignItems:'center',gap:3,flexWrap:'wrap'}}>
                <span style={{fontSize:14,fontFamily:'var(--mono)',color:'var(--text-dim)'}}>W</span>
                {Array.from({length:Math.min(slot.wt,15)}).map((_,i)=>(
                  <div key={i} onClick={()=>wound(slot,'wounds',i<(slot.wounds||0)?-1:1)}
                    style={{width: isMobile?14:10, height: isMobile?14:10,
                            borderRadius:'50%',border:'1px solid rgba(255,255,255,0.2)',cursor:'pointer',
                            background:i<(slot.wounds||0)?'var(--red)':'transparent'}}/>
                ))}
                <span style={{fontSize:14,fontFamily:'var(--mono)',color:'var(--text-dim)',marginLeft:5}}>S</span>
                {Array.from({length:Math.min(slot.st,12)}).map((_,i)=>(
                  <div key={i} onClick={()=>wound(slot,'strain',i<(slot.strain||0)?-1:1)}
                    style={{width: isMobile?14:10, height: isMobile?14:10,
                            borderRadius:'50%',border:'1px solid rgba(255,255,255,0.2)',cursor:'pointer',
                            background:i<(slot.strain||0)?'#E67E22':'transparent'}}/>
                ))}
                {(slot.crits||[]).length>0 && (
                  <span style={{padding:'2px 6px',background:'rgba(192,57,43,0.3)',border:'1px solid var(--red)',
                                borderRadius:3,fontSize:14,fontFamily:'var(--mono)',color:'var(--red)',marginLeft:5}}>
                    CRIT ×{slot.crits.length}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Right sidebar */}
      <div style={{background:'var(--bg2)',borderLeft: isMobile ? 'none' : '1px solid var(--border)',
                   borderTop: isMobile ? '1px solid var(--border)' : 'none',
                   display:'flex',flexDirection:'column',overflow: isMobile ? 'visible' : 'hidden',
                   flexShrink:0}}>
        <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)',
                     fontFamily:'var(--display)',fontSize:16,fontWeight:700,
                     letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gold)'}}>
          Combat Tools
        </div>
        <div style={{flex:1,overflowY:'auto',padding:12,display:'flex',flexDirection:'column',gap:12}}>

          {/* Add combatant */}
          <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:8,padding:14,display:'flex',flexDirection:'column',gap:10}}>
            <div style={{fontFamily:'var(--display)',fontSize:16,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-dim)'}}>
              Add Combatant
            </div>
            <div style={{display:'flex',gap:4}}>
              {['player','enemy','npc'].map(t=>{
                const col=t==='player'?'var(--gold)':t==='enemy'?'var(--red)':'var(--blue-bright)'
                return (
                  <button key={t} onClick={()=>setForm(f=>({...f,type:t}))}
                    style={{flex:1,padding:7,borderRadius:5,cursor:'pointer',
                            border:`1px solid ${form.type===t?col:'var(--border)'}`,
                            background:form.type===t?`${col}33`:'none',
                            color:form.type===t?col:'var(--text-dim)',
                            fontFamily:'var(--display)',fontSize:16,fontWeight:600,
                            textTransform:'uppercase',letterSpacing:'0.06em'}}>
                    {t}
                  </button>
                )
              })}
            </div>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
              placeholder="Name" onKeyDown={e=>e.key==='Enter'&&addCombatant()}
              style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:5,
                      padding:'7px 10px',color:'var(--text)',fontFamily:'var(--body)',fontSize:15,outline:'none'}}/>
            {form.type==='player' && chars.length>0 && (
              <select value={form.charId}
                onChange={e=>{const c=chars.find((ch:any)=>ch.id===e.target.value);setForm(f=>({...f,charId:e.target.value,name:c?c.name:f.name}))}}
                style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:5,
                        padding:'7px 10px',color:'var(--text)',fontFamily:'var(--body)',fontSize:15,outline:'none',cursor:'pointer'}}>
                <option value="">— Link character sheet (optional) —</option>
                {chars.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            <div style={{display:'flex',gap:8}}>
              {[['Wound Threshold','wt'],['Strain Threshold','st']].map(([lbl,k])=>(
                <div key={k} style={{flex:1}}>
                  <div style={{fontSize:14,fontFamily:'var(--mono)',color:'var(--text-dim)',marginBottom:3}}>{lbl}</div>
                  <input type="number" min={1} max={40} value={(form as any)[k]}
                    onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
                    style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:5,
                            padding:'7px 10px',color:'var(--text)',fontFamily:'var(--body)',fontSize:15,outline:'none'}}/>
                </div>
              ))}
            </div>
            <Btn variant="primary" style={{width:'100%',padding:'9px'}} onClick={addCombatant}>
              Add to Initiative
            </Btn>
          </div>

          {/* Dice roller */}
          <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:8,padding:14}}>
            <div style={{fontFamily:'var(--display)',fontSize:16,fontWeight:700,letterSpacing:'0.1em',
                         textTransform:'uppercase',color:'var(--text-dim)',marginBottom:10}}>Dice Roller</div>
            <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:10}}>
              {DIE_BTNS.map(d=>(
                <button key={d.key} onClick={()=>setPool(p=>({...p,[d.key]:(p as any)[d.key]+1}))}
                  style={{padding:'5px 9px',borderRadius:5,border:`1px solid ${d.col}66`,cursor:'pointer',
                          background:(pool as any)[d.key]>0?`${d.col}22`:'none',color:d.col,
                          fontFamily:'var(--display)',fontSize:16,fontWeight:600}}>
                  {(pool as any)[d.key]>0?`${d.label} ×${(pool as any)[d.key]}`:d.label}
                </button>
              ))}
            </div>
            <div style={{display:'flex',gap:6,marginBottom:10}}>
              <Btn variant="primary" style={{flex:1,padding:8}} onClick={roll}>Roll</Btn>
              <Btn style={{padding:'8px 12px'}} onClick={()=>{setPool({ability:0,proficiency:0,difficulty:0,challenge:0,boost:0,setback:0});setResult(null)}}>Clear</Btn>
            </div>
            <div style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:6,padding:12,minHeight:72}}>
              {!result && <span style={{color:'var(--text-dim)',fontFamily:'var(--mono)',fontSize:16}}>Roll result will appear here</span>}
              {result && (
                <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
                  {result.s>0  && <RV val={`+${result.s}`}  lbl="Success"   col="#4CAF50"/>}
                  {result.f>0  && <RV val={`−${result.f}`}  lbl="Failure"   col="var(--red)"/>}
                  {result.a>0  && <RV val={`+${result.a}`}  lbl="Advantage" col="var(--cyan)"/>}
                  {result.th>0 && <RV val={`−${result.th}`} lbl="Threat"    col="#FF9800"/>}
                  {result.t>0  && <RV val={`★ ${result.t}`} lbl="Triumph"   col="#FFD700"/>}
                  {result.d>0  && <RV val={`✕ ${result.d}`} lbl="Despair"   col="var(--red)"/>}
                  {Object.values(result).every(v=>v===0) && <span style={{color:'var(--text-dim)'}}>No net result</span>}
                </div>
              )}
            </div>
          </div>

          {/* Combat log */}
          <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:8,padding:12}}>
            <div style={{fontFamily:'var(--display)',fontSize:15,fontWeight:700,letterSpacing:'0.1em',
                         textTransform:'uppercase',color:'var(--text-dim)',marginBottom:8}}>Combat Log</div>
            <div style={{display:'flex',flexDirection:'column',gap:3,maxHeight:180,overflowY:'auto'}}>
              {(data.log||[]).map((e:any)=>(
                <div key={e.id} style={{fontSize:15,fontFamily:'var(--mono)',padding:'3px 0',
                                        borderBottom:'1px solid rgba(255,255,255,0.04)',
                                        color:e.type==='important'?'var(--gold)':e.type==='danger'?'var(--red)':'var(--text-dim)'}}>
                  <span style={{opacity:0.5,marginRight:6}}>{String(e.time||'').slice(11,16)}</span>
                  {e.message}
                </div>
              ))}
              {(data.log||[]).length===0 && <div style={{fontSize:15,color:'var(--text-dim)',fontFamily:'var(--mono)'}}>No entries yet.</div>}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function GmPage() {
  const [tab, setTab] = useState<'dashboard'|'initiative'>('dashboard')

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column'}}>
      {/* Sub-nav */}
      <div style={{display:'flex',borderBottom:'1px solid var(--border)',flexShrink:0,
                   background:'var(--bg2)',paddingLeft:12}}>
        {([['dashboard','⚙  Dashboard'],['initiative','⚡  Initiative']] as const).map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)}
            style={{padding:'10px 18px',border:'none',background:'none',cursor:'pointer',
                    fontFamily:'var(--display)',fontSize:15,fontWeight:600,letterSpacing:'0.08em',
                    textTransform:'uppercase',
                    color:tab===id?'var(--gold)':'var(--text-dim)',
                    borderBottom:tab===id?'2px solid var(--gold)':'2px solid transparent',
                    transition:'color 0.15s'}}>
            {label}
          </button>
        ))}
      </div>
      <div style={{flex:1,overflow:'hidden'}}>
        {tab==='dashboard'  && <GMDashboard/>}
        {tab==='initiative' && <InitiativeTracker/>}
      </div>
    </div>
  )
}
