'use client'
// app/(app)/characters/page.tsx

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { api, useDebounce, useIsMobile, SBtn, Btn, CardSection } from '@/lib/ui'
import {
  CHAR_COLORS, CHAR_KEYS, SKILL_CHAR, CHAR_ABBR, CHAR_ABBR_CYCLE,
  DEFAULT_CHAR, DEFAULT_SKILLS, CREW_CRIT,
} from '@/lib/gameData'

// ─────────────────────────────────────────────────────────────────────────────
// CRITICAL INJURIES REFERENCE TABLE
// ─────────────────────────────────────────────────────────────────────────────
function CritRefTable() {
  const [open, setOpen] = useState(false)
  const sevColor = (s:number) => s>=4?'#922B21':s>=3?'var(--red)':s>=2?'#D35400':'#E67E22'
  const sevLabel = (s:number) => s>=5?'Fatal':s>=4?'Severe':s>=3?'Serious':s>=2?'Major':'Minor'
  return (
    <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:8,
                 overflow:'hidden',marginBottom:16}}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{width:'100%',padding:'12px 16px',background:'none',border:'none',cursor:'pointer',
                display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{fontFamily:'var(--mono)',fontSize:16,fontWeight:700,color:'var(--red)',
                      textTransform:'uppercase',letterSpacing:'0.1em'}}>Critical Injuries Reference Table</span>
        <span style={{fontFamily:'var(--mono)',fontSize:16,color:'var(--text-dim)'}}>{open?'▲':'▼'}</span>
      </button>
      {open && (
        <div style={{padding:'0 12px 12px',overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:15}}>
            <thead>
              <tr style={{background:'var(--panel2)'}}>
                {['Roll','Severity','Result','Effect'].map(h=>(
                  <th key={h} style={{padding:'6px 10px',textAlign:'left',fontFamily:'var(--mono)',
                                      fontSize:14,color:'var(--text-dim)',textTransform:'uppercase',
                                      letterSpacing:'0.08em',borderBottom:'1px solid var(--border2)'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CREW_CRIT.map((c,i)=>(
                <tr key={i} style={{borderBottom:'1px solid var(--border)',
                                    background:i%2===0?'transparent':'rgba(255,255,255,0.015)'}}>
                  <td style={{padding:'5px 10px',fontFamily:'var(--mono)',fontSize:15,
                               color:'var(--text-dim)',whiteSpace:'nowrap'}}>
                    {c.lo===c.hi?c.lo:`${c.lo}–${c.hi}`}
                  </td>
                  <td style={{padding:'5px 10px',whiteSpace:'nowrap'}}>
                    <span style={{fontFamily:'var(--mono)',fontSize:14,color:sevColor(c.sev),
                                  background:`${sevColor(c.sev)}18`,padding:'2px 7px',borderRadius:3,
                                  border:`1px solid ${sevColor(c.sev)}40`}}>
                      {sevLabel(c.sev)}
                    </span>
                  </td>
                  <td style={{padding:'5px 10px',color:'var(--text-bright)',fontWeight:600}}>{c.name}</td>
                  <td style={{padding:'5px 10px',color:'var(--text-dim)',fontSize:15}}>{c.eff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CHARACTER SHEET
// ─────────────────────────────────────────────────────────────────────────────
function CharacterSheet({ char, onChange }: { char:any; onChange:(c:any)=>void }) {
  const color   = CHAR_COLORS[char.colorIdx] || CHAR_COLORS[0]
  const initials = (char.name||'??').split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase()||'??'

  function update(path: string, val: any) {
    const parts = path.split('.'); const nc={...char}; let obj=nc
    for(let i=0;i<parts.length-1;i++){obj[parts[i]]={...obj[parts[i]]};obj=obj[parts[i]]}
    obj[parts[parts.length-1]]=val; onChange(nc)
  }

  const [newTalent, setNewTalent] = useState({name:'',desc:''})
  const [newWeapon, setNewWeapon] = useState({name:'',skill:'',dam:'',crit:'',range:'',qualities:''})

  const derivedWT   = (char.characteristics?.Brawn||2) + (char.woundThreshold||12)
  const derivedST   = (char.characteristics?.Willpower||2) + (char.strainThreshold||12)
  const derivedSoak = (char.characteristics?.Brawn||2) + (char.soak||0)

  const inp = (style?:any) => ({
    background:'none',border:'none',borderBottom:'1px solid var(--border)',
    color:'var(--text)',fontFamily:'var(--body)',fontSize:15,padding:'2px 0',
    outline:'none',minWidth:80,...style
  })

  return (
    <div style={{flex:1,overflowY:'auto',padding:20,background:'var(--bg)'}}>
      <div style={{maxWidth:900,margin:'0 auto'}}>

        {/* ── Header ── */}
        <div style={{display:'flex',alignItems:'flex-start',gap:20,marginBottom:24,
                     padding:20,background:'var(--panel)',border:'1px solid var(--border)',borderRadius:8}}>
          <div style={{width:72,height:72,borderRadius:'50%',display:'flex',alignItems:'center',
                       justifyContent:'center',background:`${color}22`,border:`2px solid ${color}`,flexShrink:0}}>
            <span style={{fontFamily:'var(--display)',fontSize:35,fontWeight:700,color}}>{initials}</span>
          </div>
          <div style={{flex:1}}>
            <input value={char.name||''} onChange={e=>update('name',e.target.value)} placeholder="Character Name"
              style={{fontFamily:'var(--display)',fontSize:27,fontWeight:700,color:'var(--text-bright)',
                      background:'none',border:'none',borderBottom:'1px solid var(--border2)',
                      width:'100%',marginBottom:8,padding:'2px 0',outline:'none'}}/>
            <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
              {[['player','Player'],['species','Species'],['career','Career'],['specialisation','Specialisation']].map(([k,l])=>(
                <div key={k} style={{display:'flex',flexDirection:'column',gap:2}}>
                  <div style={{fontSize:14,fontFamily:'var(--mono)',color:'var(--text-dim)',
                               textTransform:'uppercase',letterSpacing:'0.1em'}}>{l}</div>
                  <input value={char[k]||''} onChange={e=>update(k,e.target.value)} placeholder="—"
                    style={inp({minWidth:90})}/>
                </div>
              ))}
              <div style={{display:'flex',flexDirection:'column',gap:2}}>
                <div style={{fontSize:14,fontFamily:'var(--mono)',color:'var(--text-dim)',
                             textTransform:'uppercase',letterSpacing:'0.1em'}}>Colour</div>
                <div style={{display:'flex',gap:5,marginTop:4}}>
                  {CHAR_COLORS.map((c,i)=>(
                    <div key={i} onClick={()=>update('colorIdx',i)}
                      style={{width:16,height:16,borderRadius:'50%',background:c,cursor:'pointer',
                              border:char.colorIdx===i?'2px solid white':'2px solid transparent'}}/>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'flex-end',flexShrink:0}}>
            <div>
              <div style={{fontSize:14,fontFamily:'var(--mono)',color:'var(--text-dim)',textAlign:'right',marginBottom:2}}>XP SPENT</div>
              <div style={{display:'flex',alignItems:'center',gap:4}}>
                <div style={{fontFamily:'var(--display)',fontSize:23,fontWeight:700,color:'var(--gold)'}}>{char.xp||0}</div>
                <SBtn onClick={()=>update('xp',(char.xp||0)+5)}>+</SBtn>
                <SBtn onClick={()=>update('xp',Math.max(0,(char.xp||0)-5))}>−</SBtn>
              </div>
            </div>
            <div>
              <div style={{fontSize:14,fontFamily:'var(--mono)',color:'var(--text-dim)',textAlign:'right',marginBottom:2}}>DUTY</div>
              <div style={{display:'flex',alignItems:'center',gap:4}}>
                <div style={{fontFamily:'var(--display)',fontSize:23,fontWeight:700,color:'var(--gold)'}}>{char.duty||0}</div>
                <SBtn onClick={()=>update('duty',(char.duty||0)+1)}>+</SBtn>
                <SBtn onClick={()=>update('duty',Math.max(0,(char.duty||0)-1))}>−</SBtn>
              </div>
            </div>
          </div>
        </div>

        {/* ── Characteristics ── */}
        <CardSection title="Characteristics">
          <div className="sr-char-grid-6">
            {CHAR_KEYS.map(k=>(
              <div key={k} style={{background:'var(--panel)',border:'1px solid var(--border)',
                                   borderRadius:6,padding:'10px 8px',textAlign:'center'}}>
                <div style={{fontSize:14,fontFamily:'var(--mono)',color:'var(--text-dim)',
                             textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>{k}</div>
                <div style={{fontFamily:'var(--display)',fontSize:31,fontWeight:700,
                             color:'var(--text-bright)',lineHeight:1}}>
                  {char.characteristics?.[k]||1}
                </div>
                <div style={{display:'flex',gap:4,justifyContent:'center',marginTop:6}}>
                  <SBtn onClick={()=>update(`characteristics.${k}`,Math.max(1,(char.characteristics?.[k]||1)-1))}>−</SBtn>
                  <SBtn onClick={()=>update(`characteristics.${k}`,Math.min(6,(char.characteristics?.[k]||1)+1))}>+</SBtn>
                </div>
              </div>
            ))}
          </div>
        </CardSection>

        {/* ── Derived Stats ── */}
        <CardSection title="Derived Statistics">
          <div className="sr-char-grid-4">
            {([['Wounds','wounds',derivedWT,'var(--red)'],
               ['Strain','strain',derivedST,'#E67E22']] as [string,string,number,string][]).map(([lbl,field,max,col])=>(
              <div key={field} style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,padding:10}}>
                <div style={{fontSize:14,fontFamily:'var(--mono)',color:'var(--text-dim)',
                             textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>{lbl}</div>
                <div style={{fontFamily:'var(--display)',fontSize:23,fontWeight:700,color:'var(--text-bright)'}}>
                  {char[field]||0} / {max}
                </div>
                <div style={{display:'flex',gap:3,flexWrap:'wrap',marginTop:6}}>
                  {Array.from({length:max}).map((_,i)=>(
                    <div key={i}
                      onClick={()=>update(field,i<(char[field]||0)?i:i+1)}
                      style={{width:13,height:13,borderRadius:2,cursor:'pointer',
                              border:'1px solid rgba(255,255,255,0.14)',
                              background:i<(char[field]||0)?col:'transparent'}}/>
                  ))}
                </div>
              </div>
            ))}
            <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,padding:10}}>
              <div style={{fontSize:14,fontFamily:'var(--mono)',color:'var(--text-dim)',
                           textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>Soak</div>
              <div style={{fontFamily:'var(--display)',fontSize:23,fontWeight:700,color:'var(--text-bright)'}}>{derivedSoak}</div>
              <div style={{fontSize:15,color:'var(--text-dim)',marginTop:4}}>Brawn + armour</div>
            </div>
            <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,padding:10}}>
              <div style={{fontSize:14,fontFamily:'var(--mono)',color:'var(--text-dim)',
                           textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>Defence</div>
              <div style={{fontFamily:'var(--display)',fontSize:23,fontWeight:700,color:'var(--text-bright)'}}>{char.defense||0}</div>
              <div style={{display:'flex',gap:4,marginTop:6}}>
                <SBtn onClick={()=>update('defense',Math.max(0,(char.defense||0)-1))}>−</SBtn>
                <SBtn onClick={()=>update('defense',(char.defense||0)+1)}>+</SBtn>
              </div>
            </div>
          </div>
        </CardSection>

        {/* ── Skills ── */}
        <CardSection title="Skills">
          <div className="sr-skills-grid">
            {Object.entries({...DEFAULT_SKILLS,...(char.skills||{})}).map(([skill,rawVal]:any)=>{
              const rank         = typeof rawVal==='object' ? (rawVal.rank??0) : (rawVal??0)
              const charOverride = typeof rawVal==='object' ? rawVal.char : undefined
              const defaultAbbr  = SKILL_CHAR[skill] || 'Br'
              const abbr         = charOverride || defaultAbbr
              const isCustom     = !!charOverride && charOverride !== defaultAbbr
              const charKey      = Object.keys(CHAR_ABBR).find(k=>CHAR_ABBR[k]===abbr)
              const charVal      = charKey ? (char.characteristics?.[charKey]||2) : 2
              const prof         = Math.min(rank,charVal)
              const abil         = Math.max(rank,charVal) - prof
              return (
                <div key={skill} style={{display:'flex',alignItems:'center',gap:8,padding:'4px 6px',borderRadius:4}}>
                  <div
                    onClick={()=>{
                      const next = CHAR_ABBR_CYCLE[(CHAR_ABBR_CYCLE.indexOf(abbr)+1) % CHAR_ABBR_CYCLE.length]
                      update(`skills.${skill}`, next===defaultAbbr ? rank : {rank, char:next})
                    }}
                    title={`Linked to ${abbr} — click to change`}
                    style={{fontSize:15,fontFamily:'var(--mono)',width:30,textAlign:'center',
                            cursor:'pointer',borderRadius:3,padding:'1px 2px',userSelect:'none',
                            color:isCustom?'var(--gold)':'var(--text-dim)',
                            background:isCustom?'rgba(212,172,13,0.1)':'transparent',
                            border:isCustom?'1px solid rgba(212,172,13,0.35)':'1px solid transparent'}}>
                    {abbr}
                  </div>
                  <div style={{flex:1,fontSize:15,color:'var(--text)'}}>{skill}</div>
                  <div style={{display:'flex',gap:3}}>
                    {Array.from({length:prof}).map((_,i)=>(
                      <div key={`p${i}`} style={{width:14,height:14,borderRadius:3,background:'#FFD700',
                                                  color:'#332200',display:'flex',alignItems:'center',
                                                  justifyContent:'center',fontSize:14,fontWeight:700}}>Y</div>
                    ))}
                    {Array.from({length:abil}).map((_,i)=>(
                      <div key={`a${i}`} style={{width:14,height:14,borderRadius:3,background:'#4CAF50',
                                                  color:'#002200',display:'flex',alignItems:'center',
                                                  justifyContent:'center',fontSize:14,fontWeight:700}}>G</div>
                    ))}
                    {rank===0&&<div style={{width:14,height:14,borderRadius:3,background:'rgba(255,255,255,0.08)',
                                            color:'var(--text-dim)',display:'flex',alignItems:'center',
                                            justifyContent:'center',fontSize:14}}>—</div>}
                  </div>
                  <div style={{display:'flex',gap:2,alignItems:'center'}}>
                    <SBtn onClick={()=>update(`skills.${skill}`, typeof rawVal==='object'?{...rawVal,rank:Math.max(0,rank-1)}:Math.max(0,rank-1))}>−</SBtn>
                    <span style={{fontFamily:'var(--mono)',fontSize:16,width:14,textAlign:'center',color:'var(--text)'}}>{rank}</span>
                    <SBtn onClick={()=>update(`skills.${skill}`, typeof rawVal==='object'?{...rawVal,rank:Math.min(5,rank+1)}:Math.min(5,rank+1))}>+</SBtn>
                  </div>
                </div>
              )
            })}
          </div>
        </CardSection>

        {/* ── Talents ── */}
        <CardSection title="Talents & Abilities">
          {(char.talents||[]).map((t:any,i:number)=>(
            <div key={i} style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,
                                  padding:10,display:'flex',gap:10,alignItems:'flex-start',marginBottom:6}}>
              <div style={{flex:1}}>
                <div style={{fontFamily:'var(--display)',fontSize:15,fontWeight:600,color:'var(--text-bright)',marginBottom:2}}>{t.name}</div>
                <div style={{fontSize:16,color:'var(--text-dim)',lineHeight:1.5}}>{t.desc}</div>
              </div>
              <button onClick={()=>update('talents',(char.talents||[]).filter((_:any,j:number)=>j!==i))}
                style={{background:'none',border:'none',color:'var(--text-dim)',fontSize:19,cursor:'pointer'}}>×</button>
            </div>
          ))}
          <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:8}}>
            <input value={newTalent.name} onChange={e=>setNewTalent(t=>({...t,name:e.target.value}))}
              placeholder="Talent name"
              style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,
                      padding:'8px 10px',color:'var(--text)',fontFamily:'var(--body)',fontSize:15,outline:'none'}}/>
            <div style={{display:'flex',gap:8}}>
              <input value={newTalent.desc} onChange={e=>setNewTalent(t=>({...t,desc:e.target.value}))}
                placeholder="Description"
                style={{flex:1,background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,
                        padding:'8px 10px',color:'var(--text)',fontFamily:'var(--body)',fontSize:15,outline:'none'}}/>
              <Btn variant="primary" onClick={()=>{
                if(!newTalent.name.trim()) return
                update('talents',[...(char.talents||[]),newTalent])
                setNewTalent({name:'',desc:''})
              }}>Add</Btn>
            </div>
          </div>
        </CardSection>

        {/* ── Weapons ── */}
        <CardSection title="Weapons">
          <div style={{overflowX:'auto',WebkitOverflowScrolling:'touch' as any}}>
          <table style={{width:'100%',borderCollapse:'collapse',minWidth:480}}>
            <thead>
              <tr>{['Name','Skill','Dam','Crit','Range','Qualities',''].map(h=>(
                <th key={h} style={{fontFamily:'var(--mono)',fontSize:14,textTransform:'uppercase',
                                    letterSpacing:'0.08em',color:'var(--text-dim)',padding:'5px 7px',
                                    textAlign:'left',borderBottom:'1px solid var(--border)'}}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {(char.weapons||[]).map((w:any,i:number)=>(
                <tr key={i}>
                  {(['name','skill','dam','crit','range','qualities'] as const).map(f=>(
                    <td key={f} style={{padding:'6px 7px',fontSize:15,borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                      <input value={w[f]||''} onChange={e=>{
                        const ws=[...char.weapons]; ws[i]={...ws[i],[f]:e.target.value}; update('weapons',ws)
                      }} style={{background:'none',border:'none',color:'var(--text)',fontFamily:'var(--body)',fontSize:15,outline:'none',width:'100%'}}/>
                    </td>
                  ))}
                  <td>
                    <button onClick={()=>update('weapons',(char.weapons||[]).filter((_:any,j:number)=>j!==i))}
                      style={{background:'none',border:'none',color:'var(--text-dim)',fontSize:19,cursor:'pointer'}}>×</button>
                  </td>
                </tr>
              ))}
              <tr>
                {(['name','skill','dam','crit','range','qualities'] as const).map(f=>(
                  <td key={f} style={{padding:'4px 7px'}}>
                    <input value={(newWeapon as any)[f]||''} onChange={e=>setNewWeapon(w=>({...w,[f]:e.target.value}))}
                      placeholder={f}
                      style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:4,
                              padding:'5px 7px',color:'var(--text)',fontFamily:'var(--body)',fontSize:15,
                              outline:'none',width:'100%'}}/>
                  </td>
                ))}
                <td style={{padding:'4px 7px'}}>
                  <Btn variant="primary" style={{padding:'6px 10px'}} onClick={()=>{
                    if(!newWeapon.name.trim()) return
                    update('weapons',[...(char.weapons||[]),newWeapon])
                    setNewWeapon({name:'',skill:'',dam:'',crit:'',range:'',qualities:''})
                  }}>+</Btn>
                </td>
              </tr>
            </tbody>
          </table>
          </div>
        </CardSection>

        {/* ── Notes ── */}
        <CardSection title="Notes & Backstory">
          <textarea value={char.notes||''} onChange={e=>update('notes',e.target.value)} rows={5}
            style={{width:'100%',background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,
                    padding:10,color:'var(--text)',fontFamily:'var(--body)',fontSize:15,
                    resize:'vertical',outline:'none',lineHeight:1.6}}
            placeholder="Character notes, backstory, contacts..."/>
        </CardSection>

        <CritRefTable/>

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CHARACTERS VIEW
// ─────────────────────────────────────────────────────────────────────────────
function CharactersView({ isGm, userId }: { isGm: boolean; userId: string }) {
  const [chars, setChars]       = useState<any[]>([])
  const [activeId, setActiveId] = useState<string|null>(null)
  const [saving, setSaving]     = useState(false)
  const [loading, setLoading]   = useState(true)
  const isMobile                = useIsMobile()

  const showSheet = !isMobile || activeId !== null
  const showList  = !isMobile || activeId === null

  const activeChar    = chars.find(c=>c.id===activeId)
  const debouncedChar = useDebounce(activeChar, 1000)

  useEffect(() => {
    api('/api/characters').then(d=>{
      setChars(d)
      if (!isGm && d.length > 0) setActiveId(d[0].id)
      setLoading(false)
    }).catch(()=>setLoading(false))
  }, [])

  useEffect(() => {
    if (!debouncedChar?.id) return
    setSaving(true)
    api(`/api/characters/${debouncedChar.id}`, 'PUT', debouncedChar)
      .finally(() => setSaving(false))
  }, [debouncedChar])

  async function addChar() {
    const id = crypto.randomUUID()
    const nc = {...DEFAULT_CHAR, id, colorIdx:chars.length % CHAR_COLORS.length}
    await api('/api/characters','POST',nc)
    setChars(c=>[...c,nc]); setActiveId(id)
  }

  async function deleteChar(id: string) {
    await api(`/api/characters/${id}`,'DELETE')
    setChars(c=>c.filter(ch=>ch.id!==id))
    if (activeId===id) setActiveId(chars.find(c=>c.id!==id)?.id||null)
  }

  function updateChar(id: string, nc: any) {
    setChars(c=>c.map(ch=>ch.id===id?{...nc,id}:ch))
  }

  return (
    <div style={{height:'100%',display:'flex'}}>
      {showList && (
        <div style={isMobile
          ? {flex:1,background:'var(--bg2)',display:'flex',flexDirection:'column'}
          : {width:260,flexShrink:0,background:'var(--bg2)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column'}}>
          <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)',
                       display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{fontFamily:'var(--display)',fontSize:16,fontWeight:700,
                         letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gold)'}}>Characters</div>
            {isGm && (
              <button onClick={addChar}
                style={{width:28,height:28,borderRadius:'50%',border:'1px solid var(--border2)',
                        background:'var(--panel)',color:'var(--text-dim)',fontSize:21,cursor:'pointer',
                        display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
            )}
          </div>
          <div style={{flex:1,overflowY:'auto',padding:8}}>
            {loading && <div style={{padding:'20px',textAlign:'center',color:'var(--text-dim)',fontSize:16,fontFamily:'var(--mono)'}}>Loading...</div>}
            {!loading&&chars.length===0 && (
              <div style={{padding:'20px',textAlign:'center',color:'var(--text-dim)',fontSize:16,fontFamily:'var(--mono)'}}>
                No characters yet.<br/>Click + to create one.
              </div>
            )}
            {chars.map(c=>{
              const col=CHAR_COLORS[c.colorIdx]||CHAR_COLORS[0]
              const ini=(c.name||'??').split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase()||'??'
              const canDelete = isGm || c.ownerId === userId
              return (
                <div key={c.id} onClick={()=>setActiveId(c.id)}
                  style={{padding:'9px 10px',borderRadius:6,cursor:'pointer',marginBottom:2,
                          display:'flex',alignItems:'center',gap:10,transition:'all 0.2s',
                          background:activeId===c.id?'rgba(212,172,13,0.08)':'transparent',
                          border:activeId===c.id?'1px solid rgba(212,172,13,0.3)':'1px solid transparent'}}>
                  <div style={{width:36,height:36,borderRadius:'50%',display:'flex',alignItems:'center',
                               justifyContent:'center',background:`${col}22`,color:col,
                               fontFamily:'var(--display)',fontSize:19,fontWeight:700,flexShrink:0}}>
                    {ini}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:'var(--display)',fontSize:16,fontWeight:600,color:'var(--text-bright)'}}>{c.name}</div>
                    <div style={{fontSize:15,color:'var(--text-dim)'}}>{c.career}{c.specialisation?` · ${c.specialisation}`:''}</div>
                  </div>
                  {canDelete && (
                    <button onClick={e=>{e.stopPropagation();deleteChar(c.id)}}
                      style={{background:'none',border:'none',color:'var(--text-dim)',fontSize:17,cursor:'pointer'}}>×</button>
                  )}
                </div>
              )
            })}
          </div>
          {saving && (
            <div style={{padding:'8px 12px',borderTop:'1px solid var(--border)',
                         fontSize:15,color:'var(--gold)',fontFamily:'var(--mono)',textAlign:'center'}}>
              Saving to database…
            </div>
          )}
        </div>
      )}
      {showSheet && (
        activeChar
          ? <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0,overflow:'hidden'}}>
              {isMobile && (
                <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',
                             background:'var(--bg2)',display:'flex',alignItems:'center',gap:10}}>
                  <button onClick={()=>setActiveId(null)}
                    style={{background:'none',border:'none',color:'var(--gold)',fontFamily:'var(--display)',
                            fontSize:16,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
                    ← Back
                  </button>
                  <span style={{fontFamily:'var(--display)',fontSize:16,fontWeight:600,color:'var(--text-bright)'}}>
                    {activeChar.name}
                  </span>
                </div>
              )}
              <CharacterSheet key={activeChar.id} char={activeChar} onChange={c=>updateChar(activeChar.id,c)}/>
            </div>
          : (
            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',
                         justifyContent:'center',gap:12,color:'var(--text-dim)',background:'var(--bg)'}}>
              <div style={{fontSize:51,opacity:0.3}}>◈</div>
              <div style={{fontFamily:'var(--display)',fontSize:19,letterSpacing:'0.08em'}}>
                Select or create a character
              </div>
              {isGm && <Btn variant="primary" onClick={addChar}>Create Character</Btn>}
            </div>
          )
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function CharactersPage() {
  const { user } = useAuth()
  return <CharactersView isGm={user?.role==='gm'} userId={user?.id||''} />
}
