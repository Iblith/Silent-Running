'use client'
// lib/ui.tsx
// Shared utilities, hooks, and small UI components used across all pages.

import React, { useState, useEffect } from 'react'
import { DIE_FACES } from './gameData'

// ─────────────────────────────────────────────────────────────────────────────
// API HELPER
// ─────────────────────────────────────────────────────────────────────────────
export async function api(path: string, method='GET', body?: any) {
  const res = await fetch(path, {
    method,
    headers: body ? {'Content-Type':'application/json'} : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${method} ${path} → ${res.status}: ${text}`)
  }
  return res.json()
}

// ─────────────────────────────────────────────────────────────────────────────
// DICE ENGINE
// ─────────────────────────────────────────────────────────────────────────────
export function rollDice(pool: Record<string,number>) {
  const tot: Record<string,number> = {s:0,f:0,a:0,th:0,t:0,d:0}
  Object.entries(pool).forEach(([type,count]) => {
    const faces = DIE_FACES[type]; if (!faces || !count) return
    for (let i=0;i<count;i++) {
      const face = faces[Math.floor(Math.random()*faces.length)] || []
      face.forEach((r:any) => Object.entries(r).forEach(([k,v]:any) => tot[k]=(tot[k]||0)+v))
    }
  })
  return {
    s:  Math.max(0,tot.s-tot.f),
    f:  Math.max(0,tot.f-tot.s),
    a:  Math.max(0,tot.a-tot.th),
    th: Math.max(0,tot.th-tot.a),
    t:  tot.t, d: tot.d,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────────────────────────
export function useDebounce<T>(value: T, delay=900): T {
  const [dv, setDv] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return dv
}

export function useIsMobile(breakpoint=768) {
  const [m, setM] = useState(false)
  useEffect(() => {
    const check = () => setM(window.innerWidth <= breakpoint)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [breakpoint])
  return m
}

// ─────────────────────────────────────────────────────────────────────────────
// SHIP CATEGORY COLOUR
// ─────────────────────────────────────────────────────────────────────────────
export function shipCatColor(c: string) {
  if (c==='PLAYER SHIP')      return 'var(--gold)'
  if (c==='CAPITAL SHIP')     return '#ef5350'
  if (c==='REBEL VESSEL')     return '#66bb6a'
  if (c==='STARFIGHTER')      return '#4fc3f7'
  if (c==='BOMBER')           return '#ff7043'
  if (c==='ASSAULT GUNSHIP')  return '#ff9800'
  if (c==='TRANSPORT')        return '#90a4ae'
  if (c==='PATROL / CORVETTE')return '#ce93d8'
  return '#78909c'
}

// ─────────────────────────────────────────────────────────────────────────────
// SMALL SHARED UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
export function SBtn({ onClick, children, title }: { onClick:()=>void; children:React.ReactNode; title?:string }) {
  return (
    <button
      onClick={onClick} title={title}
      style={{width:20,height:20,borderRadius:'50%',border:'1px solid var(--border)',background:'none',
              color:'var(--text-dim)',fontSize:17,display:'inline-flex',alignItems:'center',
              justifyContent:'center',transition:'all 0.15s'}}
    >{children}</button>
  )
}

export function Btn({ onClick, children, variant='default', style={} }:
  { onClick:()=>void; children:React.ReactNode; variant?:string; style?:any }) {
  const v: Record<string,any> = {
    default: {background:'var(--panel)',border:'1px solid var(--border2)',color:'var(--text)'},
    primary: {background:'rgba(212,172,13,0.15)',border:'1px solid rgba(212,172,13,0.5)',color:'var(--gold)'},
    success: {background:'rgba(30,132,73,0.15)',border:'1px solid rgba(30,132,73,0.4)',color:'var(--green-bright)'},
    danger:  {background:'rgba(192,57,43,0.15)',border:'1px solid rgba(192,57,43,0.4)',color:'var(--red)'},
  }
  return (
    <button onClick={onClick}
      style={{padding:'8px 16px',borderRadius:6,fontFamily:'var(--display)',fontSize:15,fontWeight:600,
              letterSpacing:'0.06em',textTransform:'uppercase',...v[variant],...style}}
    >{children}</button>
  )
}

export function CardSection({ title, children }: { title:string; children:React.ReactNode }) {
  return (
    <div style={{marginBottom:16}}>
      <div style={{fontFamily:'var(--display)',fontSize:15,fontWeight:700,letterSpacing:'0.12em',
                   textTransform:'uppercase',color:'var(--gold)',marginBottom:10,paddingBottom:6,
                   borderBottom:'1px solid rgba(212,172,13,0.3)'}}>{title}</div>
      {children}
    </div>
  )
}

export function GmCard({ title, children, col=1 }: { title:string; children:React.ReactNode; col?:number }) {
  return (
    <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:8,
                 padding:16,gridColumn:`span ${col}`}}>
      <div style={{fontFamily:'var(--display)',fontSize:15,fontWeight:700,letterSpacing:'0.12em',
                   textTransform:'uppercase',color:'var(--gold)',marginBottom:14,paddingBottom:8,
                   borderBottom:'1px solid rgba(212,172,13,0.3)'}}>{title}</div>
      {children}
    </div>
  )
}

export function RV({ val, lbl, col }: { val:string; lbl:string; col:string }) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
      <div style={{fontFamily:'var(--display)',fontSize:25,fontWeight:700,color:col}}>{val}</div>
      <div style={{fontSize:14,textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--text-dim)'}}>{lbl}</div>
    </div>
  )
}
