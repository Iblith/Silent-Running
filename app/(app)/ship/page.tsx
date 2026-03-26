'use client'
// app/(app)/ship/page.tsx

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { api, useDebounce, useIsMobile, SBtn, Btn } from '@/lib/ui'

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT SHIP STATE
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
  skills: {
    astrogation: 0, computers: 0, cool: 0, mechanics: 0,
    perception: 0, pilotingPlanetary: 0, pilotingSpace: 0,
    vigilance: 0, gunnery: 0,
  },
}

const SHIP_SKILLS: [keyof typeof DEFAULT_SHIP['skills'], string, string][] = [
  ['astrogation',      'Astrogation',       'Int'],
  ['computers',        'Computers',         'Int'],
  ['cool',             'Cool',              'Pr'],
  ['mechanics',        'Mechanics',         'Int'],
  ['perception',       'Perception',        'Cun'],
  ['pilotingPlanetary','Piloting: Planetary','Ag'],
  ['pilotingSpace',    'Piloting: Space',   'Ag'],
  ['vigilance',        'Vigilance',         'Will'],
  ['gunnery',          'Gunnery',           'Ag'],
]

// ─────────────────────────────────────────────────────────────────────────────
// SMALL HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily:'var(--mono)', fontSize:12, fontWeight:700,
      color:'var(--gold)', letterSpacing:'0.15em', textTransform:'uppercase',
      borderBottom:'1px solid rgba(212,172,13,0.25)', paddingBottom:6, marginBottom:12,
    }}>{children}</div>
  )
}

function StatBox({ label, value, color='var(--text-bright)', sub }:
  { label:string; value:React.ReactNode; color?:string; sub?:string }) {
  return (
    <div style={{
      background:'var(--panel)', border:'1px solid var(--border)',
      borderRadius:6, padding:'10px 12px', textAlign:'center', flex:1,
    }}>
      <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-dim)',
                   textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>{label}</div>
      <div style={{fontFamily:'var(--display)',fontSize:26,fontWeight:700,color,lineHeight:1}}>{value}</div>
      {sub && <div style={{fontSize:12,color:'var(--text-dim)',marginTop:3}}>{sub}</div>}
    </div>
  )
}

function TraumaTrack({ label, current, threshold, color, onChange }:
  { label:string; current:number; threshold:number; color:string; onChange:(v:number)=>void }) {
  return (
    <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,padding:12}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-dim)',
                     textTransform:'uppercase',letterSpacing:'0.1em'}}>{label}</div>
        <div style={{fontFamily:'var(--display)',fontSize:18,fontWeight:700,color}}>
          {current} <span style={{fontSize:13,color:'var(--text-dim)'}}>/ {threshold}</span>
        </div>
      </div>
      <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
        {Array.from({length:threshold}).map((_,i)=>(
          <div key={i} onClick={()=>onChange(i < current ? i : i+1)}
            style={{width:14,height:14,borderRadius:2,cursor:'pointer',
                    border:`1px solid ${color}40`,
                    background: i < current ? color : 'transparent',
                    transition:'background 0.1s'}}/>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFENSE ARC DISPLAY
// ─────────────────────────────────────────────────────────────────────────────
function DefenseArc({ label, defense, shields, isGm, onDefenseChange, onShieldsChange }:
  { label:string; defense:number; shields:number; isGm:boolean;
    onDefenseChange:(v:number)=>void; onShieldsChange:(v:number)=>void }) {
  return (
    <div style={{
      background:'rgba(0,188,212,0.05)', border:'1px solid rgba(0,188,212,0.2)',
      borderRadius:6, padding:'8px 10px', textAlign:'center', flex:1, minWidth:70,
    }}>
      <div style={{fontFamily:'var(--mono)',fontSize:10,color:'rgba(0,188,212,0.7)',
                   textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:6}}>{label}</div>
      <div style={{display:'flex',gap:8,justifyContent:'center'}}>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:10,fontFamily:'var(--mono)',color:'var(--text-dim)',marginBottom:2}}>DEF</div>
          <div style={{display:'flex',alignItems:'center',gap:2,justifyContent:'center'}}>
            {isGm && <SBtn onClick={()=>onDefenseChange(Math.max(0,defense-1))}>−</SBtn>}
            <span style={{fontFamily:'var(--display)',fontSize:18,fontWeight:700,
                          color:'var(--text-bright)',minWidth:16,textAlign:'center'}}>{defense}</span>
            {isGm && <SBtn onClick={()=>onDefenseChange(defense+1)}>+</SBtn>}
          </div>
        </div>
        <div style={{width:1,background:'rgba(255,255,255,0.08)'}}/>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:10,fontFamily:'var(--mono)',color:'#00BCD4',marginBottom:2}}>SHIELDS</div>
          <div style={{display:'flex',alignItems:'center',gap:2,justifyContent:'center'}}>
            <SBtn onClick={()=>onShieldsChange(Math.max(0,shields-1))}>−</SBtn>
            <span style={{fontFamily:'var(--display)',fontSize:18,fontWeight:700,
                          color:'#00BCD4',minWidth:16,textAlign:'center'}}>{shields}</span>
            <SBtn onClick={()=>onShieldsChange(shields+1)}>+</SBtn>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SHIP PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function ShipPage() {
  const { user }   = useAuth()
  const isGm       = user?.role === 'gm'
  const isMobile   = useIsMobile()
  const [ship,     setShip]     = useState<typeof DEFAULT_SHIP>(DEFAULT_SHIP)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)

  // GM weapon/attachment form state
  const [newWeapon,     setNewWeapon]     = useState({name:'',range:'',firingArc:'',damage:0,crit:0,special:''})
  const [newAttachment, setNewAttachment] = useState({name:'',description:'',hardPoints:0})

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

  const inpStyle = (extra?: any): React.CSSProperties => ({
    background:'none', border:'none', borderBottom:'1px solid var(--border)',
    color:'var(--text)', fontFamily:'var(--body)', fontSize:15,
    padding:'2px 0', outline:'none', width:'100%', ...extra,
  })

  const fieldInp = (extra?: any): React.CSSProperties => ({
    background:'var(--panel)', border:'1px solid var(--border)', borderRadius:4,
    color:'var(--text)', fontFamily:'var(--body)', fontSize:15,
    padding:'6px 8px', outline:'none', width:'100%', ...extra,
  })

  if (loading) return (
    <div style={{height:'100%',display:'flex',alignItems:'center',justifyContent:'center',
                 background:'var(--bg)',color:'var(--text-dim)',fontFamily:'var(--mono)',gap:10}}>
      <span style={{animation:'pulse 1s ease-in-out infinite'}}>●</span> Loading ship data…
    </div>
  )

  return (
    <div style={{height:'100%',overflowY:'auto',background:'var(--bg)'}}>
      <div style={{maxWidth:980,margin:'0 auto',padding: isMobile ? '12px 12px 24px' : '20px 20px 40px'}}>

        {/* ── HEADER ── */}
        <div style={{
          background:'var(--panel)', border:'1px solid var(--border)', borderRadius:8,
          padding: isMobile ? '14px 14px' : '18px 24px', marginBottom:16, position:'relative',
          borderTop:'2px solid rgba(0,188,212,0.4)',
        }}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:2,
                       background:'linear-gradient(90deg,transparent,rgba(0,188,212,0.6),rgba(212,172,13,0.4),transparent)'}}/>

          <div style={{display:'flex',alignItems:'flex-start',gap:16,flexWrap:'wrap'}}>
            <div style={{flex:1,minWidth:200}}>
              {isGm ? (
                <input value={ship.name} onChange={e=>update('name',e.target.value)}
                  style={{fontFamily:'var(--display)',fontSize: isMobile ? 24 : 32,fontWeight:700,
                          color:'var(--text-bright)',background:'none',border:'none',
                          borderBottom:'1px solid var(--border2)',width:'100%',
                          padding:'2px 0',outline:'none',marginBottom:6}}/>
              ) : (
                <div style={{fontFamily:'var(--display)',fontSize: isMobile ? 24 : 32,fontWeight:700,
                             color:'var(--text-bright)',marginBottom:6}}>{ship.name}</div>
              )}
              {isGm ? (
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--text-dim)',
                                textTransform:'uppercase',letterSpacing:'0.1em',flexShrink:0}}>
                    Make &amp; Model:
                  </span>
                  <input value={ship.model} onChange={e=>update('model',e.target.value)}
                    placeholder="—" style={inpStyle({fontSize:14,color:'var(--text-dim)'})}/>
                </div>
              ) : (
                <div style={{fontFamily:'var(--mono)',fontSize:13,color:'var(--text-dim)'}}>
                  {ship.model || '— Unknown class —'}
                </div>
              )}
            </div>

            {/* Saving indicator */}
            <div style={{fontFamily:'var(--mono)',fontSize:12,color:saving?'var(--gold)':'var(--text-dim)',
                         opacity:saving?1:0.4,transition:'opacity 0.3s',alignSelf:'flex-end'}}>
              {saving ? '● TRANSMITTING' : '● SYNCED'}
            </div>
          </div>

          {/* Core stats row */}
          <div style={{display:'flex',gap:8,marginTop:14,flexWrap:'wrap'}}>
            {([
              ['Speed',     'speed',      2,  'var(--text-bright)'],
              ['Silhouette','silhouette', 4,  'var(--text-bright)'],
              ['Handling',  'handling',   -1, ship.handling >= 0 ? '#66bb6a' : 'var(--red)'],
              ['Armor',     'armor',      3,  '#4FC3F7'],
            ] as [string,string,number,string][]).map(([lbl,field,_def,col])=>(
              <div key={field} style={{
                background:'var(--bg3)',border:'1px solid var(--border)',
                borderRadius:6,padding:'8px 12px',textAlign:'center',flex:'1 1 70px',
              }}>
                <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-dim)',
                             textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>{lbl}</div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>
                  {isGm && <SBtn onClick={()=>update(field,(ship as any)[field]-1)}>−</SBtn>}
                  <span style={{fontFamily:'var(--display)',fontSize:24,fontWeight:700,color:col}}>
                    {(ship as any)[field]}
                  </span>
                  {isGm && <SBtn onClick={()=>update(field,(ship as any)[field]+1)}>+</SBtn>}
                </div>
              </div>
            ))}
            {/* Current Speed — all users */}
            <div style={{
              background:'var(--bg3)',border:'1px solid rgba(212,172,13,0.3)',
              borderRadius:6,padding:'8px 12px',textAlign:'center',flex:'1 1 70px',
            }}>
              <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--gold)',
                           textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>
                Cur. Speed
              </div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>
                <SBtn onClick={()=>update('currentSpeed',Math.max(0,ship.currentSpeed-1))}>−</SBtn>
                <span style={{fontFamily:'var(--display)',fontSize:24,fontWeight:700,color:'var(--gold)'}}>
                  {ship.currentSpeed}
                </span>
                <SBtn onClick={()=>update('currentSpeed',Math.min(ship.speed,ship.currentSpeed+1))}>+</SBtn>
              </div>
              <div style={{display:'flex',gap:2,justifyContent:'center',marginTop:4}}>
                {Array.from({length:ship.speed+1}).map((_,i)=>(
                  <div key={i} onClick={()=>update('currentSpeed',i)}
                    style={{width:8,height:8,borderRadius:1,cursor:'pointer',
                            background:i<=ship.currentSpeed?'var(--gold)':'rgba(212,172,13,0.15)',
                            border:'1px solid rgba(212,172,13,0.3)'}}/>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── MAIN GRID ── */}
        <div style={{display:'grid',gridTemplateColumns: isMobile ? '1fr' : '1fr 340px',gap:16}}>

          {/* LEFT COLUMN */}
          <div style={{display:'flex',flexDirection:'column',gap:16}}>

            {/* SHIP IMAGE + DEFENSE ARCS */}
            <div style={{
              background:'var(--panel)',border:'1px solid var(--border)',borderRadius:8,
              padding:16,overflow:'hidden',position:'relative',
            }}>
              <SectionHeader>Tactical Display</SectionHeader>

              {/* Fore arc */}
              <div style={{marginBottom:8}}>
                <DefenseArc label="⬆ Fore"
                  defense={ship.defense.fore} shields={ship.shields.fore}
                  isGm={isGm}
                  onDefenseChange={v=>update('defense.fore',v)}
                  onShieldsChange={v=>update('shields.fore',v)}/>
              </div>

              {/* Ship image with port/starboard flanking */}
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                <DefenseArc label="◀ Port"
                  defense={ship.defense.port} shields={ship.shields.port}
                  isGm={isGm}
                  onDefenseChange={v=>update('defense.port',v)}
                  onShieldsChange={v=>update('shields.port',v)}/>

                {/* Ship image */}
                <div style={{
                  flex:1, display:'flex', alignItems:'center', justifyContent:'center',
                  padding:'8px 0', position:'relative',
                }}>
                  <div style={{
                    position:'absolute',inset:0,
                    background:'radial-gradient(ellipse at center, rgba(0,188,212,0.08) 0%, transparent 70%)',
                    borderRadius:8,
                  }}/>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/ship.png" alt="Ship schematic"
                    style={{
                      maxWidth:'100%', maxHeight: isMobile ? 140 : 200,
                      objectFit:'contain',
                      filter:'invert(1) sepia(1) saturate(2) hue-rotate(170deg) brightness(0.75)',
                      opacity:0.85,
                    }}
                    onError={e=>{(e.target as HTMLImageElement).style.display='none'}}/>
                </div>

                <DefenseArc label="Starboard ▶"
                  defense={ship.defense.starboard} shields={ship.shields.starboard}
                  isGm={isGm}
                  onDefenseChange={v=>update('defense.starboard',v)}
                  onShieldsChange={v=>update('shields.starboard',v)}/>
              </div>

              {/* Aft arc */}
              <div>
                <DefenseArc label="⬇ Aft"
                  defense={ship.defense.aft} shields={ship.shields.aft}
                  isGm={isGm}
                  onDefenseChange={v=>update('defense.aft',v)}
                  onShieldsChange={v=>update('shields.aft',v)}/>
              </div>
            </div>

            {/* HULL & STRAIN TRACKERS */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {isGm ? (
                <>
                  <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,padding:10}}>
                    <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>Hull Threshold (base)</div>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <SBtn onClick={()=>update('hullTraumaThreshold',Math.max(1,ship.hullTraumaThreshold-1))}>−</SBtn>
                      <span style={{fontFamily:'var(--display)',fontSize:22,fontWeight:700,color:'var(--text-bright)',minWidth:28,textAlign:'center'}}>{ship.hullTraumaThreshold}</span>
                      <SBtn onClick={()=>update('hullTraumaThreshold',ship.hullTraumaThreshold+1)}>+</SBtn>
                    </div>
                  </div>
                  <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,padding:10}}>
                    <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>Strain Threshold (base)</div>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <SBtn onClick={()=>update('systemStrainThreshold',Math.max(1,ship.systemStrainThreshold-1))}>−</SBtn>
                      <span style={{fontFamily:'var(--display)',fontSize:22,fontWeight:700,color:'var(--text-bright)',minWidth:28,textAlign:'center'}}>{ship.systemStrainThreshold}</span>
                      <SBtn onClick={()=>update('systemStrainThreshold',ship.systemStrainThreshold+1)}>+</SBtn>
                    </div>
                  </div>
                </>
              ) : null}
              <div style={{gridColumn: isGm ? 'span 2' : 'span 2'}}>
                <TraumaTrack label="Hull Trauma"
                  current={ship.hullTraumaCurrent} threshold={ship.hullTraumaThreshold}
                  color="var(--red)"
                  onChange={v=>update('hullTraumaCurrent',v)}/>
              </div>
              <div style={{gridColumn:'span 2'}}>
                <TraumaTrack label="System Strain"
                  current={ship.systemStrainCurrent} threshold={ship.systemStrainThreshold}
                  color="#E67E22"
                  onChange={v=>update('systemStrainCurrent',v)}/>
              </div>
            </div>

            {/* WEAPONS */}
            <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:8,padding:16}}>
              <SectionHeader>Weapons &amp; Armament</SectionHeader>
              {ship.weapons.length === 0 && (
                <div style={{fontFamily:'var(--mono)',fontSize:13,color:'var(--text-dim)',marginBottom:12}}>
                  No weapons configured.
                </div>
              )}
              {ship.weapons.map((w:any,i:number)=>(
                <div key={i} style={{
                  background:'var(--bg3)',border:'1px solid var(--border)',
                  borderRadius:6,padding:10,marginBottom:8,
                }}>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8}}>
                    <div style={{fontFamily:'var(--display)',fontSize:15,fontWeight:700,
                                 color:'var(--text-bright)',marginBottom:4}}>{w.name}</div>
                    {isGm && (
                      <button onClick={()=>update('weapons',ship.weapons.filter((_:any,j:number)=>j!==i))}
                        style={{background:'none',border:'none',color:'var(--text-dim)',fontSize:18,cursor:'pointer',flexShrink:0}}>×</button>
                    )}
                  </div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
                    {[['Range',w.range],['Arc',w.firingArc],['Dam',w.damage],['Crit',w.crit]].map(([lbl,val])=>val!==''&&val!==0?
                      <span key={lbl as string} style={{fontFamily:'var(--mono)',fontSize:12,
                              background:'rgba(255,255,255,0.04)',border:'1px solid var(--border)',
                              borderRadius:3,padding:'2px 7px',color:'var(--text-dim)'}}>
                        <span style={{color:'var(--text-dim)'}}>{lbl}: </span>
                        <span style={{color:'var(--text-bright)'}}>{val as string}</span>
                      </span> : null
                    )}
                    {w.special && (
                      <span style={{fontFamily:'var(--body)',fontSize:13,color:'var(--text-dim)',fontStyle:'italic'}}>
                        {w.special}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {isGm && (
                <div style={{background:'rgba(212,172,13,0.04)',border:'1px dashed rgba(212,172,13,0.2)',
                             borderRadius:6,padding:12,marginTop:8}}>
                  <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--gold)',
                               textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10}}>
                    + Add Weapon
                  </div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:8}}>
                    {([['name','Name','3 1 140px'],['range','Range','1 1 80px'],['firingArc','Arc','1 1 80px']] as [string,string,string][]).map(([f,l,flex])=>(
                      <div key={f} style={{flex:flex,minWidth:70}}>
                        <div style={{fontSize:11,fontFamily:'var(--mono)',color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:3}}>{l}</div>
                        <input value={(newWeapon as any)[f]||''} onChange={e=>setNewWeapon(w=>({...w,[f]:e.target.value}))} style={fieldInp()}/>
                      </div>
                    ))}
                    <div style={{flex:'1 1 55px',minWidth:50}}>
                      <div style={{fontSize:11,fontFamily:'var(--mono)',color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:3}}>Dam</div>
                      <input type="number" value={newWeapon.damage} onChange={e=>setNewWeapon(w=>({...w,damage:Number(e.target.value)}))} style={fieldInp()}/>
                    </div>
                    <div style={{flex:'1 1 55px',minWidth:50}}>
                      <div style={{fontSize:11,fontFamily:'var(--mono)',color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:3}}>Crit</div>
                      <input type="number" value={newWeapon.crit} onChange={e=>setNewWeapon(w=>({...w,crit:Number(e.target.value)}))} style={fieldInp()}/>
                    </div>
                    <div style={{flex:'3 1 160px'}}>
                      <div style={{fontSize:11,fontFamily:'var(--mono)',color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:3}}>Special Qualities</div>
                      <input value={newWeapon.special} onChange={e=>setNewWeapon(w=>({...w,special:e.target.value}))} style={fieldInp()}/>
                    </div>
                  </div>
                  <Btn variant="primary" onClick={()=>{
                    if(!newWeapon.name.trim()) return
                    update('weapons',[...ship.weapons,{...newWeapon}])
                    setNewWeapon({name:'',range:'',firingArc:'',damage:0,crit:0,special:''})
                  }}>Add Weapon</Btn>
                </div>
              )}
            </div>

            {/* ATTACHMENTS */}
            <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:8,padding:16}}>
              <SectionHeader>Modifications &amp; Attachments</SectionHeader>
              {ship.attachments.length === 0 && (
                <div style={{fontFamily:'var(--mono)',fontSize:13,color:'var(--text-dim)',marginBottom:isGm?12:0}}>
                  No modifications installed.
                </div>
              )}
              {ship.attachments.map((a:any,i:number)=>(
                <div key={i} style={{
                  background:'var(--bg3)',border:'1px solid var(--border)',
                  borderRadius:6,padding:10,marginBottom:8,
                }}>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8}}>
                    <div>
                      <div style={{fontFamily:'var(--display)',fontSize:15,fontWeight:700,
                                   color:'#4FC3F7',marginBottom:2}}>{a.name}</div>
                      {a.hardPoints > 0 && (
                        <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-dim)',marginBottom:4}}>
                          Hard Points: {a.hardPoints}
                        </div>
                      )}
                      {a.description && (
                        <div style={{fontSize:14,color:'var(--text-dim)',lineHeight:1.55}}>{a.description}</div>
                      )}
                    </div>
                    {isGm && (
                      <button onClick={()=>update('attachments',ship.attachments.filter((_:any,j:number)=>j!==i))}
                        style={{background:'none',border:'none',color:'var(--text-dim)',fontSize:18,cursor:'pointer',flexShrink:0}}>×</button>
                    )}
                  </div>
                </div>
              ))}
              {isGm && (
                <div style={{background:'rgba(79,195,247,0.04)',border:'1px dashed rgba(79,195,247,0.2)',
                             borderRadius:6,padding:12,marginTop:8}}>
                  <div style={{fontFamily:'var(--mono)',fontSize:11,color:'#4FC3F7',
                               textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10}}>
                    + Add Modification
                  </div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:8}}>
                    <div style={{flex:'3 1 160px'}}>
                      <div style={{fontSize:11,fontFamily:'var(--mono)',color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:3}}>Name</div>
                      <input value={newAttachment.name} onChange={e=>setNewAttachment(a=>({...a,name:e.target.value}))} style={fieldInp()}/>
                    </div>
                    <div style={{flex:'1 1 70px'}}>
                      <div style={{fontSize:11,fontFamily:'var(--mono)',color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:3}}>Hard Points</div>
                      <input type="number" value={newAttachment.hardPoints} onChange={e=>setNewAttachment(a=>({...a,hardPoints:Number(e.target.value)}))} style={fieldInp()}/>
                    </div>
                    <div style={{flex:'5 1 240px'}}>
                      <div style={{fontSize:11,fontFamily:'var(--mono)',color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:3}}>Description</div>
                      <input value={newAttachment.description} onChange={e=>setNewAttachment(a=>({...a,description:e.target.value}))} style={fieldInp()}/>
                    </div>
                  </div>
                  <Btn variant="primary" onClick={()=>{
                    if(!newAttachment.name.trim()) return
                    update('attachments',[...ship.attachments,{...newAttachment}])
                    setNewAttachment({name:'',description:'',hardPoints:0})
                  }}>Add Modification</Btn>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{display:'flex',flexDirection:'column',gap:16}}>

            {/* SKILLS */}
            <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:8,padding:16}}>
              <SectionHeader>Crew Skills</SectionHeader>
              {SHIP_SKILLS.map(([key,label,attr])=>{
                const rank = ship.skills[key] || 0
                return (
                  <div key={key} style={{
                    display:'flex',alignItems:'center',gap:8,
                    padding:'5px 0',borderBottom:'1px solid rgba(255,255,255,0.04)',
                  }}>
                    <span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-dim)',
                                  width:28,textAlign:'center',flexShrink:0,
                                  background:'rgba(255,255,255,0.04)',borderRadius:3,
                                  padding:'2px 0'}}>{attr}</span>
                    <span style={{flex:1,fontSize:14,color:'var(--text)'}}>{label}</span>
                    <div style={{display:'flex',gap:2}}>
                      {Array.from({length:5}).map((_,i)=>(
                        <div key={i} onClick={()=>update(`skills.${key}`,i<rank?i:i+1)}
                          style={{width:11,height:11,borderRadius:2,cursor:'pointer',
                                  background:i<rank?'var(--gold)':'rgba(255,255,255,0.08)',
                                  border:`1px solid ${i<rank?'rgba(212,172,13,0.5)':'rgba(255,255,255,0.1)'}`}}/>
                      ))}
                    </div>
                    <span style={{fontFamily:'var(--mono)',fontSize:13,color:'var(--text-dim)',
                                  width:14,textAlign:'center'}}>{rank}</span>
                  </div>
                )
              })}
            </div>

            {/* CARGO */}
            <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:8,padding:16}}>
              <SectionHeader>Cargo &amp; Storage</SectionHeader>
              <textarea value={ship.cargo} onChange={e=>update('cargo',e.target.value)}
                rows={5} placeholder="List cargo, contraband, stored items…"
                style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--border)',
                        borderRadius:6,padding:10,color:'var(--text)',fontFamily:'var(--body)',
                        fontSize:14,resize:'vertical',outline:'none',lineHeight:1.6,
                        boxSizing:'border-box'}}/>
            </div>

            {/* NOTES */}
            <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:8,padding:16}}>
              <SectionHeader>Ship Log &amp; Notes</SectionHeader>
              <textarea value={ship.notes} onChange={e=>update('notes',e.target.value)}
                rows={6} placeholder="Mission notes, damage log, crew remarks…"
                style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--border)',
                        borderRadius:6,padding:10,color:'var(--text)',fontFamily:'var(--body)',
                        fontSize:14,resize:'vertical',outline:'none',lineHeight:1.6,
                        boxSizing:'border-box'}}/>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
