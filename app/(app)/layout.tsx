'use client'
// app/(app)/layout.tsx
// Auth guard for all authenticated pages.
// Checks session on mount; redirects to /login if unauthenticated.
// Provides AuthContext and renders the top bar + navigation.

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { AuthContext, AuthUser } from '@/lib/auth-context'
import { api, useIsMobile } from '@/lib/ui'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()

  const [user,      setUser]      = useState<AuthUser | null>(null)
  const [checked,   setChecked]   = useState(false)
  const [heat,      setHeat]      = useState(0)
  const [session,   setSession]   = useState(1)
  const [campName,  setCampName]  = useState('Operation: Silent Running')

  const isMobile = useIsMobile()

  // Check session on mount
  useEffect(() => {
    api('/api/auth/me')
      .then((u: any) => { setUser(u); setChecked(true) })
      .catch(() => { setChecked(true); router.replace('/login') })
  }, [])

  // Fetch campaign data once we know who we are, and on route change
  useEffect(() => {
    if (!user) return
    api('/api/campaign')
      .then((d: any) => {
        setHeat(d.heatLevel || 0)
        setSession(d.session || 1)
        setCampName(d.campaignName || 'Operation: Silent Running')
      })
      .catch(() => {})
  }, [user, pathname])

  // Real-time campaign name updates dispatched by GMDashboard
  useEffect(() => {
    const handler = (e: Event) => {
      const name = (e as CustomEvent).detail || 'Operation: Silent Running'
      setCampName(name)
    }
    window.addEventListener('campaignNameChange', handler)
    return () => window.removeEventListener('campaignNameChange', handler)
  }, [])

  // Sync document title
  useEffect(() => { document.title = campName }, [campName])

  async function logout() {
    await fetch('/api/auth/logout', { method:'POST' }).catch(() => {})
    router.replace('/login')
  }

  if (!checked) {
    return (
      <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',
                   background:'var(--bg)',color:'var(--text-dim)',fontFamily:'var(--mono)',gap:12}}>
        <span style={{animation:'pulse 1s ease-in-out infinite'}}>●</span> Initialising…
      </div>
    )
  }

  if (!user) return null  // redirect already fired

  const isGm = user.role === 'gm'

  const ALL_TABS = [
    { path:'/gm',          label:'GM Dashboard', icon:'⚙',  gmOnly:true  },
    { path:'/galaxy',      label:'Galaxy Map',   icon:'✦',  gmOnly:false },
    { path:'/characters',  label: isGm ? 'Characters' : 'My Character', icon:'◈', gmOnly:false },
    { path:'/adversaries', label:'Adversaries',  icon:'⚔',  gmOnly:true  },
  ]
  const TABS = ALL_TABS.filter(t => isGm || !t.gmOnly)

  const isActive = (p: string) => pathname === p

  return (
    <AuthContext.Provider value={{ user }}>
      <div style={{height:'100vh',display:'flex',flexDirection:'column'}}>

        {/* ── Top Bar ── */}
        <div style={{height:52,flexShrink:0,display:'flex',alignItems:'center',padding:'0 16px',
                     background:'linear-gradient(90deg,#080E1C 0%,#0A1228 50%,#080E1C 100%)',
                     borderBottom:'1px solid rgba(255,255,255,0.14)',position:'relative',zIndex:100}}>
          <div style={{position:'absolute',bottom:0,left:0,right:0,height:1,
                       background:'linear-gradient(90deg,transparent,var(--red),var(--gold),var(--red),transparent)'}}/>

          {!isMobile && (
            <div style={{fontFamily:'var(--display)',fontSize:21,fontWeight:700,color:'var(--gold)',
                         letterSpacing:'0.12em',textTransform:'uppercase',marginRight:32,whiteSpace:'nowrap'}}>
              {campName}
            </div>
          )}

          {!isMobile && (
            <nav style={{display:'flex',gap:2,flex:1}}>
              {TABS.map(t => (
                <Link key={t.path} href={t.path}
                  style={{padding:'0 16px',height:52,border:'none',background:'none',textDecoration:'none',
                          fontFamily:'var(--display)',fontSize:16,fontWeight:600,
                          letterSpacing:'0.08em',textTransform:'uppercase',cursor:'pointer',
                          color:isActive(t.path)?'var(--gold)':'var(--text-dim)',transition:'all 0.2s',
                          display:'flex',alignItems:'center',gap:8,
                          borderBottom:isActive(t.path)?'2px solid var(--gold)':'2px solid transparent'}}>
                  <span style={{fontSize:17}}>{t.icon}</span>{t.label}
                </Link>
              ))}
            </nav>
          )}

          <div style={{display:'flex',alignItems:'center',gap:isMobile?10:14,marginLeft:'auto'}}>
            {!isMobile && (
              <div style={{display:'flex',alignItems:'center',gap:5,fontFamily:'var(--mono)',fontSize:16,color:'var(--text-dim)'}}>
                <span>HEAT</span>
                {Array.from({length:10}).map((_,i) => (
                  <div key={i} style={{width:8,height:8,borderRadius:1,
                                       background:i<heat?(i>=7?'var(--red)':'#E67E22'):'rgba(255,255,255,0.1)',
                                       animation:i<heat&&i>=7?'pulse 1s ease-in-out infinite':''}}/>
                ))}
                <span style={{color:heat>=7?'#ef5350':heat>=4?'#FF9800':'var(--text-dim)'}}>{heat}/10</span>
              </div>
            )}
            {!isMobile && (
              <div style={{fontFamily:'var(--mono)',fontSize:16,color:'var(--text-dim)',
                           background:'var(--panel)',border:'1px solid var(--border)',
                           borderRadius:4,padding:'3px 8px'}}>
                Session {session}
              </div>
            )}
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <span style={{fontFamily:'var(--mono)',fontSize:16,color:'var(--text-dim)'}}>{user.username}</span>
              <span style={{fontFamily:'var(--mono)',fontSize:15,borderRadius:3,padding:'2px 6px',
                            background:isGm?'rgba(212,172,13,0.1)':'rgba(74,144,226,0.1)',
                            border:`1px solid ${isGm?'rgba(212,172,13,0.3)':'rgba(74,144,226,0.3)'}`,
                            color:isGm?'var(--gold)':'#4a90e2'}}>{isGm?'GM':'PLAYER'}</span>
              <button onClick={logout}
                style={{padding:'3px 10px',borderRadius:4,border:'1px solid var(--border)',
                        background:'var(--panel)',color:'var(--text-dim)',fontFamily:'var(--display)',
                        fontSize:16,fontWeight:600,letterSpacing:'0.06em',cursor:'pointer'}}>Sign Out</button>
            </div>
          </div>
        </div>

        {/* ── Page content ── */}
        <div style={{flex:1,overflow:'hidden',marginBottom:isMobile?52:0}}>
          {children}
        </div>

        {/* ── Mobile Bottom Nav ── */}
        {isMobile && (
          <nav style={{position:'fixed',bottom:0,left:0,right:0,height:52,
                       display:'flex',background:'linear-gradient(90deg,#080E1C 0%,#0A1228 50%,#080E1C 100%)',
                       borderTop:'1px solid rgba(255,255,255,0.14)',zIndex:200}}>
            {TABS.map(t => (
              <Link key={t.path} href={t.path}
                style={{flex:1,border:'none',background:'none',cursor:'pointer',textDecoration:'none',
                        display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                        gap:3,padding:'4px 0',
                        borderTop:isActive(t.path)?'2px solid var(--gold)':'2px solid transparent',
                        color:isActive(t.path)?'var(--gold)':'var(--text-dim)'}}>
                <span style={{fontSize:21}}>{t.icon}</span>
                <span style={{fontFamily:'var(--display)',fontSize:14,fontWeight:600,
                              letterSpacing:'0.06em',textTransform:'uppercase'}}>{t.label}</span>
              </Link>
            ))}
          </nav>
        )}

      </div>
    </AuthContext.Provider>
  )
}
