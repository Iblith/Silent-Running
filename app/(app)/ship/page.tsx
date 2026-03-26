'use client'
// app/(app)/ship/page.tsx

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { api, useDebounce, useIsMobile, SBtn } from '@/lib/ui'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & DEFAULTS
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_SHIP = {
  name: 'Unknown Vessel', model: '',
  speed: 2, silhouette: 4, handling: -1,
  hullTraumaThreshold: 22, hullTraumaCurrent: 0,
  systemStrainThreshold: 15, systemStrainCurrent: 0,
  armor: 3, currentSpeed: 0,
  defense: { fore: 2, aft: 1, port: 0, starboard: 0 },
  shields: { fore: 0, aft: 0, port: 0, starboard: 0 },
  weapons: [] as any[],
  attachments: [] as any[],
  cargo: '', notes: '',
  crew: [] as any[],
  passengers: [] as any[],
  skills: {
    astrogation: 0, computers: 0, cool: 0, mechanics: 0,
    perception: 0, pilotingPlanetary: 0, pilotingSpace: 0,
    vigilance: 0, gunnery: 0,
  },
}

const SHIP_SKILLS: [string, string, string][] = [
  ['astrogation',       'Astrogation',        'Int'],
  ['computers',         'Computers',          'Int'],
  ['cool',              'Cool',               'Pr'],
  ['mechanics',         'Mechanics',          'Int'],
  ['perception',        'Perception',         'Cun'],
  ['pilotingPlanetary', 'Piloting: Planetary', 'Ag'],
  ['pilotingSpace',     'Piloting: Space',    'Ag'],
  ['vigilance',         'Vigilance',          'Will'],
  ['gunnery',           'Gunnery',            'Ag'],
]

// ─────────────────────────────────────────────────────────────────────────────
// CONSOLE PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  bg:     '#020810',
  panel:  '#040d1a',
  panel2: '#061226',
  border: 'rgba(0,188,212,0.18)',
  border2:'rgba(0,188,212,0.35)',
  cyan:   '#00BCD4',
  cyanDim:'rgba(0,188,212,0.5)',
  gold:   '#D4AC0D',
  red:    '#ef5350',
  orange: '#FF9800',
  green:  '#66bb6a',
  dim:    '#3a5a6a',
  text:   '#a8ccd8',
  bright: '#d0eaf8',
}

function ConsoleLine({ style }: { style?: React.CSSProperties }) {
  return <div style={{ height:1, background:`linear-gradient(90deg,transparent,${C.border2},transparent)`, ...style }}/>
}

function ConsoleLabel({ children, color=C.cyanDim }: { children:React.ReactNode; color?:string }) {
  return (
    <div style={{ fontFamily:'var(--mono)', fontSize:10, color, letterSpacing:'0.18em',
                  textTransform:'uppercase', marginBottom:5 }}>
      {children}
    </div>
  )
}

function BigStat({ label, value, color=C.bright, sub, editable=false, onInc, onDec }:
  { label:string; value:React.ReactNode; color?:string; sub?:string;
    editable?:boolean; onInc?:()=>void; onDec?:()=>void }) {
  return (
    <div style={{ textAlign:'center', padding:'10px 8px' }}>
      <ConsoleLabel>{label}</ConsoleLabel>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
        {editable && onDec && <SBtn onClick={onDec}>−</SBtn>}
        <div style={{ fontFamily:'var(--display)', fontSize:32, fontWeight:700, color, lineHeight:1 }}>{value}</div>
        {editable && onInc && <SBtn onClick={onInc}>+</SBtn>}
      </div>
      {sub && <div style={{ fontSize:11, color:C.dim, marginTop:3 }}>{sub}</div>}
    </div>
  )
}

function DamageBar({ label, current, threshold, color, onChange }:
  { label:string; current:number; threshold:number; color:string; onChange:(v:number)=>void }) {
  const pct = threshold > 0 ? current / threshold : 0
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
        <ConsoleLabel color={color}>{label}</ConsoleLabel>
        <span style={{ fontFamily:'var(--mono)', fontSize:11, color }}>
          {current} / {threshold}
        </span>
      </div>
      {/* progress bar */}
      <div style={{ height:6, background:`${color}18`, borderRadius:3, marginBottom:6,
                    border:`1px solid ${color}30`, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', left:0, top:0, bottom:0,
                      width:`${Math.min(100, pct*100)}%`,
                      background: pct > 0.75 ? C.red : pct > 0.4 ? C.orange : color,
                      transition:'width 0.3s, background 0.3s',
                      boxShadow:`0 0 8px ${pct > 0.75 ? C.red : color}` }}/>
      </div>
      {/* click boxes */}
      <div style={{ display:'flex', gap:2, flexWrap:'wrap' }}>
        {Array.from({ length: threshold }).map((_,i) => (
          <div key={i} onClick={() => onChange(i < current ? i : i+1)}
            style={{ width:12, height:12, borderRadius:2, cursor:'pointer',
                     border:`1px solid ${color}50`,
                     background: i < current ? color : `${color}12`,
                     boxShadow: i < current ? `0 0 4px ${color}80` : 'none',
                     transition:'background 0.1s' }}/>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB CONTENT COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function StatusTab({ ship, isGm, update }:
  { ship: typeof DEFAULT_SHIP; isGm: boolean; update:(p:string,v:any)=>void }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Damage trackers */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:6, padding:14 }}>
          <DamageBar label="Hull Trauma" current={ship.hullTraumaCurrent}
            threshold={ship.hullTraumaThreshold} color={C.red}
            onChange={v => update('hullTraumaCurrent', v)}/>
          {isGm && (
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:10 }}>
              <ConsoleLabel color={C.dim}>Threshold</ConsoleLabel>
              <SBtn onClick={()=>update('hullTraumaThreshold',Math.max(1,ship.hullTraumaThreshold-1))}>−</SBtn>
              <span style={{ fontFamily:'var(--mono)', fontSize:14, color:C.text, minWidth:22, textAlign:'center' }}>{ship.hullTraumaThreshold}</span>
              <SBtn onClick={()=>update('hullTraumaThreshold',ship.hullTraumaThreshold+1)}>+</SBtn>
            </div>
          )}
        </div>
        <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:6, padding:14 }}>
          <DamageBar label="System Strain" current={ship.systemStrainCurrent}
            threshold={ship.systemStrainThreshold} color={C.orange}
            onChange={v => update('systemStrainCurrent', v)}/>
          {isGm && (
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:10 }}>
              <ConsoleLabel color={C.dim}>Threshold</ConsoleLabel>
              <SBtn onClick={()=>update('systemStrainThreshold',Math.max(1,ship.systemStrainThreshold-1))}>−</SBtn>
              <span style={{ fontFamily:'var(--mono)', fontSize:14, color:C.text, minWidth:22, textAlign:'center' }}>{ship.systemStrainThreshold}</span>
              <SBtn onClick={()=>update('systemStrainThreshold',ship.systemStrainThreshold+1)}>+</SBtn>
            </div>
          )}
        </div>
      </div>

      {/* Shield arcs */}
      <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:6, padding:14 }}>
        <ConsoleLabel color={C.cyan}>Shield &amp; Defence Matrix</ConsoleLabel>
        <ConsoleLine style={{ marginBottom:14 }}/>

        {/* Ship image with arc overlay */}
        <div style={{ position:'relative', display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
          {/* FORE */}
          <ArcPanel label="FORE" arc="fore" ship={ship} isGm={isGm} update={update}/>
          {/* PORT | IMAGE | STARBOARD */}
          <div style={{ display:'flex', alignItems:'center', gap:8, width:'100%' }}>
            <ArcPanel label="PORT" arc="port" ship={ship} isGm={isGm} update={update}/>
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
                          padding:'6px 0', position:'relative', minHeight:120 }}>
              <div style={{ position:'absolute', inset:0,
                            background:'radial-gradient(ellipse at center, rgba(0,188,212,0.07) 0%, transparent 70%)',
                            borderRadius:8 }}/>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ship.png" alt="Ship schematic"
                style={{ maxWidth:'100%', maxHeight:120, objectFit:'contain',
                         filter:'invert(1) sepia(1) saturate(3) hue-rotate(170deg) brightness(0.6) contrast(1.2)',
                         opacity:0.9 }}
                onError={e => { (e.target as HTMLImageElement).style.display='none' }}/>
            </div>
            <ArcPanel label="STARBOARD" arc="starboard" ship={ship} isGm={isGm} update={update}/>
          </div>
          {/* AFT */}
          <ArcPanel label="AFT" arc="aft" ship={ship} isGm={isGm} update={update}/>
        </div>
      </div>

      {/* Ship log */}
      <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:6, padding:14 }}>
        <ConsoleLabel color={C.cyan}>Ship Log</ConsoleLabel>
        <ConsoleLine style={{ marginBottom:10 }}/>
        <textarea value={ship.notes} onChange={e => update('notes', e.target.value)}
          rows={5} placeholder="Mission notes, damage log, crew remarks…"
          style={{ width:'100%', background:'transparent', border:'none',
                   borderBottom:`1px solid ${C.border}`, color:C.text, fontFamily:'var(--mono)',
                   fontSize:13, resize:'vertical', outline:'none', lineHeight:1.8,
                   padding:'4px 0', boxSizing:'border-box' }}/>
      </div>
    </div>
  )
}

function ArcPanel({ label, arc, ship, isGm, update }:
  { label:string; arc:'fore'|'aft'|'port'|'starboard';
    ship:typeof DEFAULT_SHIP; isGm:boolean; update:(p:string,v:any)=>void }) {
  const def = ship.defense[arc]
  const sh  = ship.shields[arc]
  return (
    <div style={{ background:`${C.cyan}08`, border:`1px solid ${C.cyan}25`,
                  borderRadius:5, padding:'8px 10px', textAlign:'center', flex:1, minWidth:72 }}>
      <div style={{ fontFamily:'var(--mono)', fontSize:10, color:C.cyanDim,
                    letterSpacing:'0.12em', marginBottom:6 }}>{label}</div>
      <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
        <div>
          <div style={{ fontSize:9, fontFamily:'var(--mono)', color:C.dim, marginBottom:3 }}>DEF</div>
          <div style={{ display:'flex', alignItems:'center', gap:2, justifyContent:'center' }}>
            {isGm && <SBtn onClick={()=>update(`defense.${arc}`,Math.max(0,def-1))}>−</SBtn>}
            <span style={{ fontFamily:'var(--display)', fontSize:18, fontWeight:700, color:C.bright }}>{def}</span>
            {isGm && <SBtn onClick={()=>update(`defense.${arc}`,def+1)}>+</SBtn>}
          </div>
        </div>
        <div style={{ width:1, background:C.border }}/>
        <div>
          <div style={{ fontSize:9, fontFamily:'var(--mono)', color:C.cyan, marginBottom:3 }}>SHD</div>
          <div style={{ display:'flex', alignItems:'center', gap:2, justifyContent:'center' }}>
            <SBtn onClick={()=>update(`shields.${arc}`,Math.max(0,sh-1))}>−</SBtn>
            <span style={{ fontFamily:'var(--display)', fontSize:18, fontWeight:700, color:C.cyan }}>{sh}</span>
            <SBtn onClick={()=>update(`shields.${arc}`,sh+1)}>+</SBtn>
          </div>
        </div>
      </div>
    </div>
  )
}

function WeaponsTab({ ship, isGm, update }:
  { ship: typeof DEFAULT_SHIP; isGm: boolean; update:(p:string,v:any)=>void }) {
  const [form, setForm] = useState({ name:'', range:'', firingArc:'', damage:0, crit:0, special:'' })

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <ConsoleLabel color={C.cyan}>Weapons Registry — {ship.weapons.length} System{ship.weapons.length!==1?'s':''} Online</ConsoleLabel>
      <ConsoleLine/>

      {ship.weapons.length === 0 && (
        <div style={{ fontFamily:'var(--mono)', fontSize:13, color:C.dim, padding:'20px 0', textAlign:'center' }}>
          — NO WEAPONS REGISTERED —
        </div>
      )}

      {ship.weapons.map((w:any, i:number) => (
        <div key={i} style={{ background:C.panel2, border:`1px solid ${C.border}`,
                              borderLeft:`3px solid ${C.red}`, borderRadius:4, padding:'12px 14px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <div style={{ fontFamily:'var(--display)', fontSize:16, fontWeight:700,
                            color:C.bright, letterSpacing:'0.06em', marginBottom:6 }}>{w.name}</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {[['RANGE',w.range],['ARC',w.firingArc],['DAM',w.damage],['CRIT',w.crit]].map(([l,v]) =>
                  v !== '' && v !== 0 ? (
                    <span key={l as string} style={{ fontFamily:'var(--mono)', fontSize:11,
                            border:`1px solid ${C.border2}`, borderRadius:3,
                            padding:'2px 8px', color:C.cyan }}>
                      <span style={{ color:C.dim }}>{l} </span>{v as string}
                    </span>
                  ) : null
                )}
              </div>
              {w.special && (
                <div style={{ fontFamily:'var(--mono)', fontSize:12, color:C.text,
                              marginTop:6, fontStyle:'italic' }}>Special: {w.special}</div>
              )}
            </div>
            {isGm && (
              <button onClick={() => update('weapons', ship.weapons.filter((_:any,j:number) => j!==i))}
                style={{ background:'none', border:`1px solid ${C.red}40`, borderRadius:3,
                         color:C.red, fontSize:13, cursor:'pointer', padding:'2px 8px',
                         fontFamily:'var(--mono)' }}>REMOVE</button>
            )}
          </div>
        </div>
      ))}

      {isGm && (
        <div style={{ background:`${C.gold}06`, border:`1px dashed ${C.gold}30`,
                      borderRadius:6, padding:14, marginTop:6 }}>
          <ConsoleLabel color={C.gold}>+ Register New Weapon System</ConsoleLabel>
          <ConsoleLine style={{ borderColor:`${C.gold}20`, marginBottom:12 }}/>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:10 }}>
            {([['name','Designation','3 1 160px'],['range','Range','1 1 80px'],['firingArc','Firing Arc','1 1 100px']] as [string,string,string][]).map(([f,l,flex]) => (
              <div key={f} style={{ flex:flex, minWidth:70 }}>
                <ConsoleLabel>{l}</ConsoleLabel>
                <input value={(form as any)[f]||''} onChange={e => setForm(p => ({...p,[f]:e.target.value}))}
                  style={{ background:'transparent', border:`1px solid ${C.border}`, borderRadius:3,
                           color:C.text, fontFamily:'var(--mono)', fontSize:13, padding:'5px 8px',
                           outline:'none', width:'100%', boxSizing:'border-box' }}/>
              </div>
            ))}
            {([['damage','Dam','1 1 60px'],['crit','Crit','1 1 60px']] as [string,string,string][]).map(([f,l,flex]) => (
              <div key={f} style={{ flex:flex, minWidth:55 }}>
                <ConsoleLabel>{l}</ConsoleLabel>
                <input type="number" value={(form as any)[f]} onChange={e => setForm(p => ({...p,[f]:Number(e.target.value)}))}
                  style={{ background:'transparent', border:`1px solid ${C.border}`, borderRadius:3,
                           color:C.text, fontFamily:'var(--mono)', fontSize:13, padding:'5px 8px',
                           outline:'none', width:'100%', boxSizing:'border-box' }}/>
              </div>
            ))}
            <div style={{ flex:'4 1 200px' }}>
              <ConsoleLabel>Special Qualities</ConsoleLabel>
              <input value={form.special} onChange={e => setForm(p => ({...p,special:e.target.value}))}
                style={{ background:'transparent', border:`1px solid ${C.border}`, borderRadius:3,
                         color:C.text, fontFamily:'var(--mono)', fontSize:13, padding:'5px 8px',
                         outline:'none', width:'100%', boxSizing:'border-box' }}/>
            </div>
          </div>
          <button onClick={() => {
            if (!form.name.trim()) return
            update('weapons', [...ship.weapons, { ...form }])
            setForm({ name:'', range:'', firingArc:'', damage:0, crit:0, special:'' })
          }} style={{ background:`${C.gold}12`, border:`1px solid ${C.gold}50`, borderRadius:3,
                      color:C.gold, fontFamily:'var(--mono)', fontSize:12, fontWeight:700,
                      letterSpacing:'0.1em', padding:'6px 16px', cursor:'pointer',
                      textTransform:'uppercase' }}>
            Register System
          </button>
        </div>
      )}

      {/* Attachments */}
      <div style={{ marginTop:8 }}>
        <ConsoleLabel color={C.cyan}>Modifications &amp; Attachments</ConsoleLabel>
        <ConsoleLine style={{ marginBottom:14 }}/>
        {ship.attachments.length === 0 && (
          <div style={{ fontFamily:'var(--mono)', fontSize:13, color:C.dim, padding:'10px 0' }}>
            — NO MODIFICATIONS INSTALLED —
          </div>
        )}
        {ship.attachments.map((a:any,i:number) => (
          <div key={i} style={{ background:C.panel2, border:`1px solid ${C.border}`,
                                borderLeft:`3px solid #4FC3F7`, borderRadius:4,
                                padding:'10px 14px', marginBottom:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontFamily:'var(--display)', fontSize:15, fontWeight:700,
                              color:'#4FC3F7', marginBottom:3 }}>{a.name}</div>
                {a.hardPoints > 0 && (
                  <div style={{ fontFamily:'var(--mono)', fontSize:11, color:C.dim, marginBottom:4 }}>
                    HARD POINTS USED: {a.hardPoints}
                  </div>
                )}
                {a.description && (
                  <div style={{ fontSize:13, color:C.text, lineHeight:1.6 }}>{a.description}</div>
                )}
              </div>
              {isGm && (
                <button onClick={() => update('attachments', ship.attachments.filter((_:any,j:number) => j!==i))}
                  style={{ background:'none', border:`1px solid ${C.border}`, borderRadius:3,
                           color:C.dim, fontSize:13, cursor:'pointer', padding:'2px 8px',
                           fontFamily:'var(--mono)' }}>✕</button>
              )}
            </div>
          </div>
        ))}
        {isGm && <AttachmentForm ship={ship} update={update}/>}
      </div>
    </div>
  )
}

function AttachmentForm({ ship, update }:
  { ship:typeof DEFAULT_SHIP; update:(p:string,v:any)=>void }) {
  const [form, setForm] = useState({ name:'', description:'', hardPoints:0 })
  return (
    <div style={{ background:`rgba(79,195,247,0.04)`, border:`1px dashed rgba(79,195,247,0.25)`,
                  borderRadius:6, padding:14, marginTop:8 }}>
      <ConsoleLabel color="#4FC3F7">+ Install Modification</ConsoleLabel>
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:10 }}>
        <div style={{ flex:'3 1 160px' }}>
          <ConsoleLabel>Designation</ConsoleLabel>
          <input value={form.name} onChange={e => setForm(p => ({...p,name:e.target.value}))}
            style={{ background:'transparent', border:`1px solid ${C.border}`, borderRadius:3,
                     color:C.text, fontFamily:'var(--mono)', fontSize:13, padding:'5px 8px',
                     outline:'none', width:'100%', boxSizing:'border-box' }}/>
        </div>
        <div style={{ flex:'1 1 70px' }}>
          <ConsoleLabel>Hard Points</ConsoleLabel>
          <input type="number" value={form.hardPoints} onChange={e => setForm(p => ({...p,hardPoints:Number(e.target.value)}))}
            style={{ background:'transparent', border:`1px solid ${C.border}`, borderRadius:3,
                     color:C.text, fontFamily:'var(--mono)', fontSize:13, padding:'5px 8px',
                     outline:'none', width:'100%', boxSizing:'border-box' }}/>
        </div>
        <div style={{ flex:'5 1 240px' }}>
          <ConsoleLabel>Description</ConsoleLabel>
          <input value={form.description} onChange={e => setForm(p => ({...p,description:e.target.value}))}
            style={{ background:'transparent', border:`1px solid ${C.border}`, borderRadius:3,
                     color:C.text, fontFamily:'var(--mono)', fontSize:13, padding:'5px 8px',
                     outline:'none', width:'100%', boxSizing:'border-box' }}/>
        </div>
      </div>
      <button onClick={() => {
        if (!form.name.trim()) return
        update('attachments', [...ship.attachments, { ...form }])
        setForm({ name:'', description:'', hardPoints:0 })
      }} style={{ background:`rgba(79,195,247,0.1)`, border:`1px solid rgba(79,195,247,0.4)`, borderRadius:3,
                  color:'#4FC3F7', fontFamily:'var(--mono)', fontSize:12, fontWeight:700,
                  letterSpacing:'0.1em', padding:'6px 16px', cursor:'pointer', textTransform:'uppercase' }}>
        Install
      </button>
    </div>
  )
}

function CargoTab({ ship, update }:
  { ship:typeof DEFAULT_SHIP; update:(p:string,v:any)=>void }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <ConsoleLabel color={C.cyan}>Cargo Hold Manifest</ConsoleLabel>
      <ConsoleLine/>
      <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:6, padding:14 }}>
        <ConsoleLabel color={C.dim}>Inventory &amp; Cargo</ConsoleLabel>
        <textarea value={ship.cargo} onChange={e => update('cargo', e.target.value)}
          rows={12} placeholder="List cargo, contraband, stored equipment, supplies…"
          style={{ width:'100%', background:'transparent', border:'none', color:C.text,
                   fontFamily:'var(--mono)', fontSize:13, resize:'vertical', outline:'none',
                   lineHeight:1.9, padding:'4px 0', boxSizing:'border-box',
                   borderBottom:`1px solid ${C.border}` }}/>
      </div>
      <div style={{ fontFamily:'var(--mono)', fontSize:11, color:C.dim, textAlign:'right' }}>
        HOLD STATUS: {ship.cargo.trim() ? 'CARGO LOADED' : 'EMPTY'}
      </div>
    </div>
  )
}

function CrewTab({ ship, isGm, update }:
  { ship:typeof DEFAULT_SHIP; isGm:boolean; update:(p:string,v:any)=>void }) {
  const [newCrew,      setNewCrew]      = useState({ name:'', role:'', notes:'' })
  const [newPassenger, setNewPassenger] = useState({ name:'', origin:'', notes:'' })

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Crew roster */}
      <div>
        <ConsoleLabel color={C.cyan}>Crew Roster</ConsoleLabel>
        <ConsoleLine style={{ marginBottom:14 }}/>
        {ship.crew.length === 0 && (
          <div style={{ fontFamily:'var(--mono)', fontSize:13, color:C.dim, padding:'10px 0' }}>
            — NO CREW ON RECORD —
          </div>
        )}
        {ship.crew.map((c:any,i:number) => (
          <div key={i} style={{ background:C.panel2, border:`1px solid ${C.border}`,
                                borderLeft:`3px solid ${C.green}`, borderRadius:4,
                                padding:'10px 14px', marginBottom:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontFamily:'var(--display)', fontSize:15, fontWeight:700,
                              color:C.bright, marginBottom:2 }}>{c.name}</div>
                <div style={{ fontFamily:'var(--mono)', fontSize:11, color:C.green,
                              letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4 }}>{c.role}</div>
                {c.notes && <div style={{ fontSize:13, color:C.text, lineHeight:1.55 }}>{c.notes}</div>}
              </div>
              {isGm && (
                <button onClick={() => update('crew', ship.crew.filter((_:any,j:number) => j!==i))}
                  style={{ background:'none', border:`1px solid ${C.border}`, borderRadius:3,
                           color:C.dim, fontSize:13, cursor:'pointer', padding:'2px 8px',
                           fontFamily:'var(--mono)' }}>✕</button>
              )}
            </div>
          </div>
        ))}
        {isGm && (
          <div style={{ background:`${C.green}06`, border:`1px dashed ${C.green}30`,
                        borderRadius:6, padding:14, marginTop:4 }}>
            <ConsoleLabel color={C.green}>+ Assign Crew</ConsoleLabel>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:8 }}>
              {[['name','Name','2 1 140px'],['role','Role / Station','2 1 120px'],['notes','Notes','3 1 200px']].map(([f,l,flex]) => (
                <div key={f} style={{ flex:flex, minWidth:100 }}>
                  <ConsoleLabel>{l}</ConsoleLabel>
                  <input value={(newCrew as any)[f]||''} onChange={e => setNewCrew(p => ({...p,[f]:e.target.value}))}
                    style={{ background:'transparent', border:`1px solid ${C.border}`, borderRadius:3,
                             color:C.text, fontFamily:'var(--mono)', fontSize:13, padding:'5px 8px',
                             outline:'none', width:'100%', boxSizing:'border-box' }}/>
                </div>
              ))}
            </div>
            <button onClick={() => {
              if (!newCrew.name.trim()) return
              update('crew', [...ship.crew, { ...newCrew }])
              setNewCrew({ name:'', role:'', notes:'' })
            }} style={{ background:`${C.green}12`, border:`1px solid ${C.green}50`, borderRadius:3,
                        color:C.green, fontFamily:'var(--mono)', fontSize:12, fontWeight:700,
                        letterSpacing:'0.1em', padding:'6px 16px', cursor:'pointer', textTransform:'uppercase' }}>
              Assign
            </button>
          </div>
        )}
      </div>

      {/* Passengers */}
      <div>
        <ConsoleLabel color={C.cyan}>Passenger Manifest</ConsoleLabel>
        <ConsoleLine style={{ marginBottom:14 }}/>
        {ship.passengers.length === 0 && (
          <div style={{ fontFamily:'var(--mono)', fontSize:13, color:C.dim, padding:'10px 0' }}>
            — NO PASSENGERS ON RECORD —
          </div>
        )}
        {ship.passengers.map((p:any,i:number) => (
          <div key={i} style={{ background:C.panel2, border:`1px solid ${C.border}`,
                                borderLeft:`3px solid ${C.cyanDim}`, borderRadius:4,
                                padding:'10px 14px', marginBottom:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontFamily:'var(--display)', fontSize:15, fontWeight:700,
                              color:C.bright, marginBottom:2 }}>{p.name}</div>
                {p.origin && <div style={{ fontFamily:'var(--mono)', fontSize:11, color:C.cyanDim,
                                          letterSpacing:'0.1em', marginBottom:4 }}>Origin: {p.origin}</div>}
                {p.notes && <div style={{ fontSize:13, color:C.text, lineHeight:1.55 }}>{p.notes}</div>}
              </div>
              {isGm && (
                <button onClick={() => update('passengers', ship.passengers.filter((_:any,j:number) => j!==i))}
                  style={{ background:'none', border:`1px solid ${C.border}`, borderRadius:3,
                           color:C.dim, fontSize:13, cursor:'pointer', padding:'2px 8px',
                           fontFamily:'var(--mono)' }}>✕</button>
              )}
            </div>
          </div>
        ))}
        {isGm && (
          <div style={{ background:`${C.cyan}05`, border:`1px dashed ${C.cyan}25`,
                        borderRadius:6, padding:14, marginTop:4 }}>
            <ConsoleLabel color={C.cyan}>+ Add Passenger</ConsoleLabel>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:8 }}>
              {[['name','Name','2 1 140px'],['origin','Origin','2 1 120px'],['notes','Notes','3 1 200px']].map(([f,l,flex]) => (
                <div key={f} style={{ flex:flex, minWidth:100 }}>
                  <ConsoleLabel>{l}</ConsoleLabel>
                  <input value={(newPassenger as any)[f]||''} onChange={e => setNewPassenger(p => ({...p,[f]:e.target.value}))}
                    style={{ background:'transparent', border:`1px solid ${C.border}`, borderRadius:3,
                             color:C.text, fontFamily:'var(--mono)', fontSize:13, padding:'5px 8px',
                             outline:'none', width:'100%', boxSizing:'border-box' }}/>
                </div>
              ))}
            </div>
            <button onClick={() => {
              if (!newPassenger.name.trim()) return
              update('passengers', [...ship.passengers, { ...newPassenger }])
              setNewPassenger({ name:'', origin:'', notes:'' })
            }} style={{ background:`${C.cyan}10`, border:`1px solid ${C.cyan}40`, borderRadius:3,
                        color:C.cyan, fontFamily:'var(--mono)', fontSize:12, fontWeight:700,
                        letterSpacing:'0.1em', padding:'6px 16px', cursor:'pointer', textTransform:'uppercase' }}>
              Log Passenger
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function SkillsTab({ ship, update }:
  { ship:typeof DEFAULT_SHIP; update:(p:string,v:any)=>void }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <ConsoleLabel color={C.cyan}>Crew Skill Ratings</ConsoleLabel>
      <ConsoleLine style={{ marginBottom:6 }}/>
      {SHIP_SKILLS.map(([key, label, attr]) => {
        const rank = (ship.skills as any)[key] || 0
        return (
          <div key={key} style={{ display:'flex', alignItems:'center', gap:10,
                                  padding:'7px 10px', background:C.panel,
                                  border:`1px solid ${C.border}`, borderRadius:4,
                                  borderLeft:`2px solid ${rank > 0 ? C.gold : C.dim}` }}>
            <span style={{ fontFamily:'var(--mono)', fontSize:10, color:C.cyanDim, width:30,
                           textAlign:'center', flexShrink:0, background:`${C.cyan}08`,
                           border:`1px solid ${C.border}`, borderRadius:3, padding:'2px 0' }}>{attr}</span>
            <span style={{ flex:1, fontFamily:'var(--mono)', fontSize:13, color:C.text }}>{label}</span>
            <div style={{ display:'flex', gap:3 }}>
              {Array.from({ length:5 }).map((_,i) => (
                <div key={i} onClick={() => update(`skills.${key}`, i < rank ? i : i+1)}
                  style={{ width:13, height:13, borderRadius:2, cursor:'pointer',
                           background: i < rank ? C.gold : `${C.gold}12`,
                           border:`1px solid ${i < rank ? C.gold+'80' : C.border}`,
                           boxShadow: i < rank ? `0 0 4px ${C.gold}60` : 'none',
                           transition:'all 0.1s' }}/>
              ))}
            </div>
            <span style={{ fontFamily:'var(--mono)', fontSize:13, color:rank > 0 ? C.gold : C.dim,
                           width:14, textAlign:'right' }}>{rank}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { id:'status',  label:'Ship Status',    short:'STATUS'   },
  { id:'weapons', label:'Weapon Systems', short:'WEAPONS'  },
  { id:'cargo',   label:'Cargo Hold',     short:'CARGO'    },
  { id:'crew',    label:'Crew & Passengers', short:'CREW'  },
  { id:'skills',  label:'Crew Skills',    short:'SKILLS'   },
]

export default function ShipPage() {
  const { user }  = useAuth()
  const isGm      = user?.role === 'gm'
  const isMobile  = useIsMobile()
  const [ship,    setShip]    = useState<typeof DEFAULT_SHIP>(DEFAULT_SHIP)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [tab,     setTab]     = useState('status')

  const debouncedShip = useDebounce(ship, 1200)

  useEffect(() => {
    api('/api/ship').then((d: any) => {
      setShip({ ...DEFAULT_SHIP, ...d })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (loading) return
    setSaving(true)
    api('/api/ship', 'PUT', debouncedShip).finally(() => setSaving(false))
  }, [debouncedShip])

  function update(path: string, val: any) {
    const parts = path.split('.')
    setShip(prev => {
      const next = { ...prev } as any
      let obj = next
      for (let i = 0; i < parts.length - 1; i++) {
        obj[parts[i]] = { ...obj[parts[i]] }
        obj = obj[parts[i]]
      }
      obj[parts[parts.length - 1]] = val
      return next
    })
  }

  if (loading) return (
    <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center',
                  background:C.bg, color:C.cyanDim, fontFamily:'var(--mono)', gap:12, fontSize:14 }}>
      <span style={{ animation:'pulse 1s ease-in-out infinite' }}>◉</span>
      INITIALISING SHIP COMPUTER…
    </div>
  )

  const hullPct = ship.hullTraumaThreshold > 0 ? ship.hullTraumaCurrent / ship.hullTraumaThreshold : 0
  const hullColor = hullPct > 0.75 ? C.red : hullPct > 0.4 ? C.orange : C.green

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column',
                  background:C.bg, overflow:'hidden' }}>

      {/* ── SHIP HEADER ── */}
      <div style={{
        flexShrink:0,
        background:`linear-gradient(180deg, #061428 0%, ${C.panel} 100%)`,
        borderBottom:`1px solid ${C.border2}`,
        padding: isMobile ? '10px 14px' : '12px 24px',
        position:'relative', overflow:'hidden',
      }}>
        {/* Scanline effect */}
        <div style={{ position:'absolute', inset:0, backgroundImage:
          'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,188,212,0.015) 2px, rgba(0,188,212,0.015) 4px)',
          pointerEvents:'none' }}/>
        {/* Top glow line */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:1,
                      background:`linear-gradient(90deg, transparent, ${C.cyan}, transparent)` }}/>

        <div style={{ display:'flex', alignItems:'center', gap: isMobile ? 12 : 24,
                      flexWrap:'wrap', position:'relative' }}>
          {/* Ship name */}
          <div style={{ flex:1, minWidth:160 }}>
            {isGm ? (
              <input value={ship.name} onChange={e => update('name', e.target.value)}
                style={{ fontFamily:'var(--display)', fontSize: isMobile ? 20 : 26, fontWeight:700,
                         color:C.bright, background:'none', border:'none', outline:'none',
                         borderBottom:`1px solid ${C.border}`, width:'100%', padding:'2px 0',
                         letterSpacing:'0.05em' }}/>
            ) : (
              <div style={{ fontFamily:'var(--display)', fontSize: isMobile ? 20 : 26,
                            fontWeight:700, color:C.bright, letterSpacing:'0.05em' }}>{ship.name}</div>
            )}
            {isGm ? (
              <input value={ship.model} onChange={e => update('model', e.target.value)}
                placeholder="Make & Model"
                style={{ fontFamily:'var(--mono)', fontSize:11, color:C.cyanDim, background:'none',
                         border:'none', outline:'none', marginTop:2, width:'100%',
                         letterSpacing:'0.1em', textTransform:'uppercase' }}/>
            ) : (
              <div style={{ fontFamily:'var(--mono)', fontSize:11, color:C.cyanDim,
                            marginTop:2, letterSpacing:'0.1em', textTransform:'uppercase' }}>
                {ship.model || 'CLASS UNKNOWN'}
              </div>
            )}
          </div>

          {/* Core stats */}
          <div style={{ display:'flex', gap: isMobile ? 8 : 16, alignItems:'center', flexWrap:'wrap' }}>
            {([
              ['SPD',  ship.speed,      C.bright,  isGm, 'speed'],
              ['SIL',  ship.silhouette, C.bright,  isGm, 'silhouette'],
              ['HND',  ship.handling,   ship.handling >= 0 ? C.green : C.red, isGm, 'handling'],
              ['ARM',  ship.armor,      '#4FC3F7',  isGm, 'armor'],
            ] as [string,number,string,boolean,string][]).map(([l,v,col,ed,field]) => (
              <div key={field} style={{ textAlign:'center' }}>
                <div style={{ fontFamily:'var(--mono)', fontSize:9, color:C.dim,
                              letterSpacing:'0.15em', marginBottom:2 }}>{l}</div>
                <div style={{ display:'flex', alignItems:'center', gap:2 }}>
                  {ed && <SBtn onClick={()=>update(field,v-1)}>−</SBtn>}
                  <span style={{ fontFamily:'var(--display)', fontSize: isMobile?18:22,
                                 fontWeight:700, color:col }}>{v}</span>
                  {ed && <SBtn onClick={()=>update(field,v+1)}>+</SBtn>}
                </div>
              </div>
            ))}

            {/* Current speed strip */}
            <div style={{ textAlign:'center' }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:9, color:C.gold,
                            letterSpacing:'0.15em', marginBottom:2 }}>SPEED</div>
              <div style={{ display:'flex', gap:2, marginBottom:3 }}>
                <SBtn onClick={()=>update('currentSpeed',Math.max(0,ship.currentSpeed-1))}>−</SBtn>
                <span style={{ fontFamily:'var(--display)', fontSize: isMobile?18:22,
                               fontWeight:700, color:C.gold, minWidth:22, textAlign:'center' }}>
                  {ship.currentSpeed}
                </span>
                <SBtn onClick={()=>update('currentSpeed',Math.min(ship.speed,ship.currentSpeed+1))}>+</SBtn>
              </div>
              <div style={{ display:'flex', gap:2, justifyContent:'center' }}>
                {Array.from({ length: ship.speed+1 }).map((_,i) => (
                  <div key={i} onClick={() => update('currentSpeed', i)}
                    style={{ width:7, height:7, borderRadius:1, cursor:'pointer',
                             background: i <= ship.currentSpeed ? C.gold : `${C.gold}15`,
                             border:`1px solid ${C.gold}40`,
                             boxShadow: i <= ship.currentSpeed ? `0 0 3px ${C.gold}60` : 'none' }}/>
                ))}
              </div>
            </div>
          </div>

          {/* Hull status mini-bar */}
          <div style={{ display:'flex', flexDirection:'column', gap:4, minWidth: isMobile ? 80 : 100 }}>
            <div style={{ fontFamily:'var(--mono)', fontSize:9, color:hullColor,
                          letterSpacing:'0.15em' }}>HULL {ship.hullTraumaCurrent}/{ship.hullTraumaThreshold}</div>
            <div style={{ height:4, background:`${hullColor}20`, borderRadius:2,
                          border:`1px solid ${hullColor}30`, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${Math.min(100,hullPct*100)}%`,
                            background:hullColor, boxShadow:`0 0 6px ${hullColor}`,
                            transition:'width 0.3s' }}/>
            </div>
            <div style={{ fontFamily:'var(--mono)', fontSize:9,
                          color:saving ? C.gold : C.dim,
                          letterSpacing:'0.1em', opacity: saving ? 1 : 0.5 }}>
              {saving ? '● TX' : '● SYNC'}
            </div>
          </div>
        </div>
      </div>

      {/* ── TAB BAR ── */}
      <div style={{
        flexShrink:0, display:'flex', background:C.panel,
        borderBottom:`1px solid ${C.border}`, overflowX:'auto',
      }}>
        {TABS.map(t => {
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                flex: isMobile ? 'none' : 1,
                padding: isMobile ? '10px 14px' : '11px 16px',
                background:'none', border:'none', cursor:'pointer',
                fontFamily:'var(--mono)', fontSize: isMobile ? 11 : 12,
                fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase',
                color: active ? C.cyan : C.dim,
                borderBottom: active ? `2px solid ${C.cyan}` : '2px solid transparent',
                borderTop: active ? 'none' : 'none',
                whiteSpace:'nowrap', transition:'color 0.15s',
                position:'relative',
              }}>
              {isMobile ? t.short : t.label}
              {active && (
                <div style={{ position:'absolute', bottom:-1, left:'20%', right:'20%', height:1,
                              background:`linear-gradient(90deg,transparent,${C.cyan},transparent)`,
                              filter:'blur(1px)' }}/>
              )}
            </button>
          )
        })}
      </div>

      {/* ── TAB CONTENT ── */}
      <div style={{ flex:1, overflowY:'auto', padding: isMobile ? '14px' : '20px 24px' }}>
        <div style={{ maxWidth:860, margin:'0 auto' }}>
          {tab === 'status'  && <StatusTab  ship={ship} isGm={isGm} update={update}/>}
          {tab === 'weapons' && <WeaponsTab ship={ship} isGm={isGm} update={update}/>}
          {tab === 'cargo'   && <CargoTab   ship={ship} update={update}/>}
          {tab === 'crew'    && <CrewTab    ship={ship} isGm={isGm} update={update}/>}
          {tab === 'skills'  && <SkillsTab  ship={ship} update={update}/>}
        </div>
      </div>
    </div>
  )
}
