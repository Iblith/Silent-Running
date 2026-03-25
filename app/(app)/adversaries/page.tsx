'use client'
// app/(app)/adversaries/page.tsx

import React, { useState } from 'react'
import { shipCatColor } from '@/lib/ui'
import { SHIP_STATS, SHIP_CATEGORIES, NPC_STATS } from '@/lib/gameData'
import { StatBlock } from '@/lib/stat-block'

// ─────────────────────────────────────────────────────────────────────────────
// ADVERSARIES VIEW
// ─────────────────────────────────────────────────────────────────────────────
function AdversariesView() {
  const [search,      setSearch]      = useState('')
  const [typeFilter,  setTypeFilter]  = useState('ALL')
  const [selectedKey, setSelectedKey] = useState<string|null>(null)

  const filtered = Object.entries(NPC_STATS).filter(([,npc]) => {
    const matchSearch = !search || npc.name.toLowerCase().includes(search.toLowerCase()) || npc.career.toLowerCase().includes(search.toLowerCase())
    const matchType   = typeFilter==='ALL' || npc.type===typeFilter
    return matchSearch && matchType
  })

  const typeColor = (t:string) => t==='NEMESIS'?'#7b1fa2':t==='RIVAL'?'#1565c0':t==='ALLY'?'#2e7d32':'#5d4037'

  return (
    <div style={{height:'100%',display:'flex',overflow:'hidden'}}>
      <div style={{width:270,flexShrink:0,display:'flex',flexDirection:'column',
                   borderRight:'1px solid var(--border)',background:'var(--bg2)'}}>
        <div style={{padding:'12px 14px',borderBottom:'1px solid var(--border)',flexShrink:0}}>
          <div style={{fontFamily:'var(--display)',fontWeight:700,fontSize:17,
                       letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gold)',marginBottom:8}}>
            Adversaries
          </div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"
            style={{width:'100%',background:'var(--panel)',border:'1px solid var(--border)',borderRadius:4,
                    padding:'5px 10px',color:'var(--text)',fontFamily:'var(--mono)',fontSize:16,
                    outline:'none',boxSizing:'border-box'}}/>
          <div style={{display:'flex',gap:3,flexWrap:'wrap',marginTop:8}}>
            {(['ALL','NEMESIS','RIVAL','ALLY','MINION'] as const).map(t=>(
              <button key={t} onClick={()=>setTypeFilter(t)}
                style={{padding:'2px 7px',borderRadius:4,cursor:'pointer',fontFamily:'var(--mono)',fontSize:14,fontWeight:700,
                       border:`1px solid ${typeFilter===t?'rgba(212,172,13,0.5)':'var(--border)'}`,
                       background:typeFilter===t?'rgba(212,172,13,0.1)':'var(--panel)',
                       color:typeFilter===t?'var(--gold)':'var(--text-dim)'}}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div style={{flex:1,overflowY:'auto'}}>
          {filtered.length===0 && (
            <div style={{color:'var(--text-dim)',fontFamily:'var(--mono)',fontSize:16,textAlign:'center',paddingTop:32}}>
              No matches
            </div>
          )}
          {filtered.map(([key,npc])=>(
            <div key={key} onClick={()=>setSelectedKey(key===selectedKey?null:key)}
              style={{padding:'9px 14px',cursor:'pointer',borderBottom:'1px solid rgba(255,255,255,0.04)',
                      background:selectedKey===key?'rgba(212,172,13,0.08)':'transparent',
                      borderLeft:`3px solid ${selectedKey===key?typeColor(npc.type):'transparent'}`,
                      transition:'all 0.15s'}}>
              <div style={{fontFamily:'var(--display)',fontWeight:600,fontSize:15,
                           color:selectedKey===key?'var(--text-bright)':'var(--text)',marginBottom:2}}>
                {npc.name}
              </div>
              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                <span style={{fontFamily:'var(--mono)',fontSize:13,fontWeight:700,
                              color:typeColor(npc.type),letterSpacing:'0.06em'}}>{npc.type}</span>
                <span style={{fontFamily:'var(--mono)',fontSize:13,color:'var(--text-dim)'}}>·</span>
                <span style={{fontFamily:'var(--mono)',fontSize:13,color:'var(--text-dim)'}}>{npc.species}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:20,background:'var(--bg)'}}>
        {selectedKey ? (
          <StatBlock npcKey={selectedKey} isGm={true}/>
        ) : (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                       height:'100%',gap:12,color:'var(--text-dim)'}}>
            <div style={{fontSize:36,opacity:0.3}}>⚔</div>
            <div style={{fontFamily:'var(--mono)',fontSize:16,textAlign:'center'}}>
              Select an adversary from the list to view their stat block.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SHIP STAT BLOCK
// ─────────────────────────────────────────────────────────────────────────────
function ShipStatBlock({ shipKey }: { shipKey: string }) {
  const s = SHIP_STATS[shipKey]
  if (!s) return null
  const col = shipCatColor(s.category)
  return (
    <div style={{padding:'20px 24px',overflowY:'auto',height:'100%',fontFamily:'var(--body)'}}>
      <div style={{marginBottom:16}}>
        <div style={{fontFamily:'var(--mono)',fontSize:14,color:col,textTransform:'uppercase',
                     letterSpacing:'0.12em',marginBottom:4}}>{s.category}</div>
        <div style={{fontFamily:'var(--display)',fontSize:26,fontWeight:700,color:'var(--text-bright)',
                     lineHeight:1.1,marginBottom:2}}>{s.name}</div>
        <div style={{fontSize:16,color:'var(--text-dim)'}}>{s.manufacturer} — {s.model}</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:6,marginBottom:16}}>
        {([['SIL',s.silhouette],['SPD',s.speed],['HND',s.handling],['DEF F',s.defFore],
           ['DEF A',s.defAft],['ARMR',s.armour],['HT/SST',`${s.hullTrauma}/${s.systemStrain}`]] as [string,any][]).map(([lbl,val])=>(
          <div key={lbl} style={{background:'var(--panel2)',border:'1px solid var(--border2)',
                                  borderRadius:4,padding:'8px 6px',textAlign:'center'}}>
            <div style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--text-dim)',
                         textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:3}}>{lbl}</div>
            <div style={{fontFamily:'var(--display)',fontSize:20,fontWeight:700,
                         color:lbl==='HND'&&s.handling<0?'#ef5350':'var(--text-bright)'}}>{val}</div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:16,
                   background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,padding:12}}>
        <div><span style={{color:'var(--text-dim)',fontSize:14}}>Hyperdrive: </span>
             <span style={{fontSize:14,color:'var(--text-bright)'}}>{s.hyperdrive}</span></div>
        <div><span style={{color:'var(--text-dim)',fontSize:14}}>Consumables: </span>
             <span style={{fontSize:14,color:'var(--text-bright)'}}>{s.consumables}</span></div>
        <div><span style={{color:'var(--text-dim)',fontSize:14}}>Complement: </span>
             <span style={{fontSize:14,color:'var(--text-bright)'}}>{s.complement}</span></div>
      </div>
      {s.weapons.length > 0 && (
        <div style={{marginBottom:16}}>
          <div style={{fontFamily:'var(--mono)',fontSize:14,color:'var(--text-dim)',
                       textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>Weapons</div>
          <div style={{border:'1px solid var(--border)',borderRadius:6,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 2fr',
                         background:'var(--panel2)',padding:'6px 10px',
                         fontFamily:'var(--mono)',fontSize:13,color:'var(--text-dim)',
                         textTransform:'uppercase',letterSpacing:'0.08em',gap:8}}>
              <span>Name</span><span>Fire Arc</span><span>Dmg</span><span>Crit</span><span>Range</span><span>Qualities</span>
            </div>
            {s.weapons.map((w,i)=>(
              <div key={i} style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 2fr',
                                   padding:'7px 10px',gap:8,
                                   background:i%2===0?'transparent':'rgba(255,255,255,0.02)',
                                   borderTop:'1px solid var(--border)',fontSize:15,color:'var(--text)'}}>
                <span>{w.name}</span>
                <span style={{color:'var(--text-dim)'}}>{w.fire}</span>
                <span style={{color:'#ef5350'}}>{w.damage}</span>
                <span style={{color:'#E67E22'}}>{w.critical || '—'}</span>
                <span style={{color:'var(--text-dim)'}}>{w.range}</span>
                <span style={{color:'var(--text-dim)',fontSize:14}}>{w.qualities || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {s.abilities.length > 0 && (
        <div style={{marginBottom:16}}>
          <div style={{fontFamily:'var(--mono)',fontSize:14,color:'var(--text-dim)',
                       textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>Special Abilities</div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {s.abilities.map((a,i)=>{
              const [title,...rest] = a.split(':')
              return (
                <div key={i} style={{background:'var(--panel)',border:'1px solid var(--border)',
                                      borderLeft:`3px solid ${col}`,borderRadius:4,padding:'8px 12px',
                                      fontSize:15}}>
                  {rest.length>0
                    ? <><span style={{color:col,fontWeight:600}}>{title}:</span>
                        <span style={{color:'var(--text-dim)'}}>{rest.join(':')}</span></>
                    : <span style={{color:'var(--text-dim)'}}>{a}</span>
                  }
                </div>
              )
            })}
          </div>
        </div>
      )}
      <div style={{background:'var(--panel)',border:'1px solid var(--border)',
                   borderRadius:6,padding:'12px 14px',fontSize:16,
                   color:'var(--text-dim)',lineHeight:1.6,fontStyle:'italic'}}>
        {s.desc}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SHIPS VIEW
// ─────────────────────────────────────────────────────────────────────────────
function ShipsView() {
  const [search,      setSearch]      = useState('')
  const [catFilter,   setCatFilter]   = useState('ALL')
  const [selectedKey, setSelectedKey] = useState<string|null>(null)

  const filtered = Object.entries(SHIP_STATS).filter(([,ship]) => {
    const matchCat  = catFilter==='ALL' || ship.category===catFilter
    const matchText = search==='' || ship.name.toLowerCase().includes(search.toLowerCase()) ||
                      ship.model.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchText
  })

  return (
    <div style={{display:'flex',height:'100%',overflow:'hidden'}}>
      <div style={{width:280,flexShrink:0,borderRight:'1px solid var(--border2)',
                   display:'flex',flexDirection:'column',background:'var(--bg2)'}}>
        <div style={{padding:'12px 12px 8px'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search ships…"
            style={{width:'100%',background:'var(--panel)',border:'1px solid var(--border2)',
                    borderRadius:4,padding:'7px 10px',fontSize:16,color:'var(--text)',
                    outline:'none',fontFamily:'var(--body)'}}/>
        </div>
        <div style={{padding:'0 12px 10px',display:'flex',flexWrap:'wrap',gap:4}}>
          {SHIP_CATEGORIES.map(c=>(
            <button key={c} onClick={()=>setCatFilter(c)}
              style={{padding:'3px 8px',fontSize:13,borderRadius:3,cursor:'pointer',
                      fontFamily:'var(--mono)',letterSpacing:'0.05em',
                      background:catFilter===c?shipCatColor(c):'var(--panel)',
                      color:catFilter===c?'#000':'var(--text-dim)',
                      border:`1px solid ${catFilter===c?shipCatColor(c):'var(--border)'}`,
                      fontWeight:catFilter===c?700:400}}>
              {c==='ALL'?'All':c}
            </button>
          ))}
        </div>
        <div style={{flex:1,overflowY:'auto'}}>
          {filtered.map(([key,ship])=>(
            <div key={key} onClick={()=>setSelectedKey(key)}
              style={{padding:'9px 14px',cursor:'pointer',
                      borderLeft:`3px solid ${selectedKey===key?shipCatColor(ship.category):'transparent'}`,
                      background:selectedKey===key?'rgba(255,255,255,0.04)':'transparent',
                      borderBottom:'1px solid var(--border)'}}>
              <div style={{fontSize:16,color:selectedKey===key?'var(--text-bright)':'var(--text)',
                           fontWeight:selectedKey===key?600:400,lineHeight:1.2}}>{ship.name}</div>
              <div style={{marginTop:3,display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontFamily:'var(--mono)',fontSize:13,padding:'1px 5px',borderRadius:2,
                              background:`${shipCatColor(ship.category)}20`,color:shipCatColor(ship.category),
                              border:`1px solid ${shipCatColor(ship.category)}40`}}>
                  {ship.category}
                </span>
                <span style={{fontFamily:'var(--mono)',fontSize:13,color:'var(--text-dim)'}}>
                  SIL {ship.silhouette}
                </span>
              </div>
            </div>
          ))}
          {filtered.length===0 && (
            <div style={{padding:24,textAlign:'center',color:'var(--text-dim)',fontSize:16}}>
              No ships match your search.
            </div>
          )}
        </div>
      </div>
      <div style={{flex:1,overflow:'hidden'}}>
        {selectedKey
          ? <ShipStatBlock shipKey={selectedKey}/>
          : (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                         height:'100%',color:'var(--text-dim)',fontFamily:'var(--mono)',gap:12}}>
              <span style={{fontSize:36,opacity:0.3}}>◉</span>
              <span style={{fontSize:16,letterSpacing:'0.12em',textTransform:'uppercase'}}>
                Select a vessel to view its dossier
              </span>
            </div>
          )
        }
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function AdversariesPage() {
  const [tab, setTab] = useState<'adversaries'|'ships'>('adversaries')

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column'}}>
      {/* Sub-nav */}
      <div style={{display:'flex',borderBottom:'1px solid var(--border)',flexShrink:0,
                   background:'var(--bg2)',paddingLeft:12}}>
        {([['adversaries','⚔  Adversaries'],['ships','◉  Ships']] as const).map(([id,label])=>(
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
        {tab==='adversaries' && <AdversariesView/>}
        {tab==='ships'       && <ShipsView/>}
      </div>
    </div>
  )
}
