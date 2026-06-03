'use client'
// app/login/page.tsx

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const CHAR_COLORS = ['#2E86C1','#1E8449','#C0392B','#6C3483','#D4AC0D','#E67E22','#17A589']

export default function LoginPage() {
  const router = useRouter()
  const [campaignName, setCampaignName] = useState('Operation: Silent Running')
  const [characters, setCharacters]     = useState<{id:string;name:string;colorIdx:number}[]>([])
  const [mode, setMode]                 = useState<'player'|'gm'>('player')
  const [username, setUsername]         = useState('')
  const [password, setPassword]         = useState('')
  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [charLoading, setCharLoading]   = useState(true)

  useEffect(() => {
    fetch('/api/init', { method: 'POST' })
      .then(() => Promise.all([
        fetch('/api/campaign').then(r => r.ok ? r.json() : null),
        fetch('/api/auth/characters').then(r => r.ok ? r.json() : []),
      ]))
      .then(([campaign, chars]) => {
        if (campaign?.campaignName) setCampaignName(campaign.campaignName)
        setCharacters(chars || [])
        setCharLoading(false)
      })
      .catch(() => setCharLoading(false))
  }, [])

  async function selectCharacter(characterId: string) {
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/character-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); setLoading(false); return }
      router.push('/galaxy')
    } catch {
      setError('Network error — check your connection')
      setLoading(false)
    }
  }

  async function gmLogin(e: { preventDefault(): void }) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); setLoading(false); return }
      if (data.role !== 'gm') { setError('Not a GM account'); setLoading(false); return }
      router.push('/gm')
    } catch {
      setError('Network error — check your connection')
      setLoading(false)
    }
  }

  return (
    <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',
                 background:'var(--bg)',flexDirection:'column',gap:0,padding:'0 16px'}}>
      <div style={{fontFamily:'var(--display)',fontSize:25,fontWeight:700,color:'var(--gold)',
                   letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:6,textAlign:'center'}}>
        {campaignName}
      </div>
      <div style={{fontFamily:'var(--mono)',fontSize:16,color:'var(--text-dim)',
                   letterSpacing:'0.12em',marginBottom:32}}>SECURE ACCESS TERMINAL</div>

      {/* Mode toggle */}
      <div style={{display:'flex',marginBottom:0,width:340,background:'var(--bg3)',
                   border:'1px solid var(--border)',borderRadius:'8px 8px 0 0',overflow:'hidden'}}>
        {(['player','gm'] as const).map(m => (
          <button key={m} onClick={()=>{setMode(m);setError('')}} type="button"
            style={{flex:1,padding:'9px 0',fontFamily:'var(--mono)',fontSize:16,fontWeight:600,
                    letterSpacing:'0.1em',textTransform:'uppercase',border:'none',cursor:'pointer',
                    background: mode===m ? 'var(--panel)' : 'transparent',
                    color: mode===m ? 'var(--gold)' : 'var(--text-dim)',
                    borderBottom: mode===m ? '2px solid var(--gold)' : '2px solid transparent'}}>
            {m === 'player' ? 'Player' : 'Game Master'}
          </button>
        ))}
      </div>

      <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderTop:'none',
                   borderRadius:'0 0 10px 10px',padding:'24px 24px 28px',width:340,
                   display:'flex',flexDirection:'column',gap:16}}>

        {mode === 'player' ? (
          <>
            <div style={{fontFamily:'var(--mono)',fontSize:15,color:'var(--text-dim)',
                         letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:4}}>
              Who are you?
            </div>
            {charLoading ? (
              <div style={{textAlign:'center',padding:'20px 0',color:'var(--text-dim)',
                           fontFamily:'var(--mono)',fontSize:15}}>Loading crew manifest…</div>
            ) : characters.length === 0 ? (
              <div style={{textAlign:'center',padding:'20px 0',color:'var(--text-dim)',
                           fontFamily:'var(--mono)',fontSize:15}}>
                No characters found.<br/>Ask your GM to set up the campaign.
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {characters.map(c => {
                  const color = CHAR_COLORS[c.colorIdx] || CHAR_COLORS[0]
                  const initials = (c.name||'??').split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase()
                  return (
                    <button key={c.id}
                      onClick={() => !loading && selectCharacter(c.id)}
                      disabled={loading}
                      style={{display:'flex',alignItems:'center',gap:14,padding:'12px 14px',
                              borderRadius:8,border:`1px solid ${color}40`,cursor:loading?'wait':'pointer',
                              background:`${color}0d`,transition:'all 0.15s',
                              opacity:loading?0.6:1,textAlign:'left',width:'100%'}}>
                      <div style={{width:40,height:40,borderRadius:'50%',display:'flex',alignItems:'center',
                                   justifyContent:'center',background:`${color}22`,border:`2px solid ${color}`,
                                   flexShrink:0}}>
                        <span style={{fontFamily:'var(--display)',fontSize:18,fontWeight:700,color}}>{initials}</span>
                      </div>
                      <span style={{fontFamily:'var(--display)',fontSize:18,fontWeight:600,
                                    color:'var(--text-bright)',letterSpacing:'0.04em'}}>{c.name}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <form onSubmit={gmLogin} style={{display:'flex',flexDirection:'column',gap:16}}>
            <div>
              <div style={{fontFamily:'var(--mono)',fontSize:15,color:'var(--text-dim)',
                           letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:6}}>Username</div>
              <input value={username} onChange={e=>setUsername(e.target.value)}
                autoFocus autoComplete="username"
                style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:6,
                        padding:'9px 12px',color:'var(--text)',fontFamily:'var(--mono)',fontSize:16,
                        outline:'none',boxSizing:'border-box'}}/>
            </div>
            <div>
              <div style={{fontFamily:'var(--mono)',fontSize:15,color:'var(--text-dim)',
                           letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:6}}>Password</div>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
                autoComplete="current-password"
                style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:6,
                        padding:'9px 12px',color:'var(--text)',fontFamily:'var(--mono)',fontSize:16,
                        outline:'none',boxSizing:'border-box'}}/>
            </div>
            <button type="submit" disabled={loading}
              style={{marginTop:4,padding:'10px',borderRadius:6,border:'1px solid rgba(212,172,13,0.5)',
                      background:'rgba(212,172,13,0.12)',color:'var(--gold)',fontFamily:'var(--display)',
                      fontSize:16,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',
                      cursor:loading?'wait':'pointer',opacity:loading?0.6:1}}>
              {loading ? 'Authenticating…' : 'Sign In'}
            </button>
          </form>
        )}

        {error && (
          <div style={{fontFamily:'var(--mono)',fontSize:15,color:'var(--red)',
                       background:'rgba(192,57,43,0.1)',border:'1px solid rgba(192,57,43,0.3)',
                       borderRadius:5,padding:'7px 10px'}}>{error}</div>
        )}
      </div>
    </div>
  )
}
