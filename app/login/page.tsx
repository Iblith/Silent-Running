'use client'
// app/login/page.tsx

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [campaignName, setCampaignName] = useState('Operation: Silent Running')
  const [mode, setMode]         = useState<'login'|'signup'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    fetch('/api/init', { method:'POST' })
      .then(() => fetch('/api/campaign'))
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.campaignName) setCampaignName(d.campaignName) })
      .catch(() => {})
  }, [])

  function switchMode(m: 'login'|'signup') {
    setMode(m); setError(''); setPassword(''); setConfirm('')
  }

  async function submit(e: { preventDefault(): void }) {
    e.preventDefault()
    setError('')
    if (mode === 'signup' && password !== confirm) {
      setError('Passwords do not match'); return
    }
    setLoading(true)
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup'
      const res  = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || (mode==='login' ? 'Login failed' : 'Sign up failed')); setLoading(false); return }
      router.push(data.role === 'gm' ? '/gm' : '/galaxy')
    } catch {
      setError('Network error — check your connection')
      setLoading(false)
    }
  }

  return (
    <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',
                 background:'var(--bg)',flexDirection:'column',gap:0}}>
      <div style={{fontFamily:'var(--display)',fontSize:25,fontWeight:700,color:'var(--gold)',
                   letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:6}}>
        {campaignName}
      </div>
      <div style={{fontFamily:'var(--mono)',fontSize:16,color:'var(--text-dim)',
                   letterSpacing:'0.12em',marginBottom:32}}>SECURE ACCESS TERMINAL</div>

      {/* Mode toggle */}
      <div style={{display:'flex',marginBottom:0,width:320,background:'var(--bg3)',
                   border:'1px solid var(--border)',borderRadius:'8px 8px 0 0',overflow:'hidden'}}>
        {(['login','signup'] as const).map(m => (
          <button key={m} onClick={()=>switchMode(m)} type="button"
            style={{flex:1,padding:'9px 0',fontFamily:'var(--mono)',fontSize:16,fontWeight:600,
                    letterSpacing:'0.1em',textTransform:'uppercase',border:'none',cursor:'pointer',
                    background: mode===m ? 'var(--panel)' : 'transparent',
                    color: mode===m ? 'var(--gold)' : 'var(--text-dim)',
                    borderBottom: mode===m ? '2px solid var(--gold)' : '2px solid transparent'}}>
            {m==='login' ? 'Sign In' : 'Sign Up'}
          </button>
        ))}
      </div>

      <form onSubmit={submit}
        style={{background:'var(--panel)',border:'1px solid var(--border)',borderTop:'none',
                borderRadius:'0 0 10px 10px',padding:'24px 32px 28px',width:320,
                display:'flex',flexDirection:'column',gap:16}}>
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
            autoComplete={mode==='login' ? 'current-password' : 'new-password'}
            style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:6,
                    padding:'9px 12px',color:'var(--text)',fontFamily:'var(--mono)',fontSize:16,
                    outline:'none',boxSizing:'border-box'}}/>
        </div>
        {mode === 'signup' && (
          <div>
            <div style={{fontFamily:'var(--mono)',fontSize:15,color:'var(--text-dim)',
                         letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:6}}>Confirm Password</div>
            <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)}
              autoComplete="new-password"
              style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:6,
                      padding:'9px 12px',color:'var(--text)',fontFamily:'var(--mono)',fontSize:16,
                      outline:'none',boxSizing:'border-box'}}/>
          </div>
        )}
        {mode === 'signup' && (
          <div style={{fontFamily:'var(--mono)',fontSize:15,color:'var(--text-dim)',
                       lineHeight:1.6,padding:'6px 8px',background:'rgba(255,255,255,0.03)',
                       borderRadius:5,border:'1px solid var(--border)'}}>
            New accounts have <span style={{color:'var(--text)'}}>player access</span> — galaxy map &amp; your character only.
            Your GM will link your character after you sign up.
          </div>
        )}
        {error && (
          <div style={{fontFamily:'var(--mono)',fontSize:16,color:'var(--red)',
                       background:'rgba(192,57,43,0.1)',border:'1px solid rgba(192,57,43,0.3)',
                       borderRadius:5,padding:'7px 10px'}}>{error}</div>
        )}
        <button type="submit" disabled={loading}
          style={{marginTop:4,padding:'10px',borderRadius:6,border:'1px solid rgba(212,172,13,0.5)',
                  background:'rgba(212,172,13,0.12)',color:'var(--gold)',fontFamily:'var(--display)',
                  fontSize:16,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',
                  cursor:loading?'wait':'pointer',opacity:loading?0.6:1}}>
          {loading ? (mode==='login' ? 'Authenticating…' : 'Creating Account…') : (mode==='login' ? 'Sign In' : 'Create Account')}
        </button>
      </form>
    </div>
  )
}
