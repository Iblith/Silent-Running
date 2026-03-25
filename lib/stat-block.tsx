'use client'
// lib/stat-block.tsx
// NPC stat block component — used in AdversariesView and LocationModal.

import React from 'react'
import { NPC_STATS } from './gameData'

export function StatBlock({ npcKey, isGm }: { npcKey: string; isGm: boolean }) {
  const npc = NPC_STATS[npcKey]
  if (!npc) return null
  const typeColor = npc.type==='NEMESIS'?'#7b1fa2':npc.type==='RIVAL'?'#1565c0':npc.type==='ALLY'?'#2e7d32':'#5d4037'
  const typeBg   = npc.type==='NEMESIS'?'rgba(123,31,162,0.12)':npc.type==='RIVAL'?'rgba(21,101,192,0.12)':npc.type==='ALLY'?'rgba(46,125,50,0.12)':'rgba(93,64,55,0.12)'
  const charVals   = [npc.brawn,npc.agility,npc.intellect,npc.cunning,npc.willpower,npc.presence]
  const charLabels = ['Brawn','Agility','Intellect','Cunning','Willpower','Presence']
  return (
    <div style={{background:'var(--panel)',border:`2px solid ${typeColor}`,borderRadius:8,overflow:'hidden',marginBottom:12}}>
      <div style={{background:typeColor,padding:'8px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
        <div>
          <div style={{fontFamily:'var(--display)',fontWeight:700,fontSize:18,color:'#fff'}}>{npc.name}</div>
          <div style={{fontSize:15,color:'rgba(255,255,255,0.75)',fontFamily:'var(--mono)',letterSpacing:'0.08em'}}>{npc.species} · {npc.career}</div>
        </div>
        <div style={{background:'rgba(255,255,255,0.18)',borderRadius:4,padding:'2px 8px',fontFamily:'var(--mono)',fontSize:15,fontWeight:700,color:'#fff',flexShrink:0}}>{npc.type}</div>
      </div>
      {/* Characteristics */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:1,background:'var(--border)'}}>
        {charLabels.map((c,i)=>(
          <div key={c} style={{background:typeBg,padding:'5px 2px',textAlign:'center'}}>
            <div style={{fontSize:13,fontFamily:'var(--mono)',color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.04em'}}>{c.slice(0,3)}</div>
            <div style={{fontSize:23,fontWeight:700,fontFamily:'var(--display)',color:typeColor,lineHeight:1.1}}>{charVals[i]}</div>
          </div>
        ))}
      </div>
      {/* Derived stats */}
      <div style={{display:'flex',gap:10,padding:'7px 12px',flexWrap:'wrap',borderBottom:'1px solid var(--border)'}}>
        {[
          {l:'Soak', v:npc.soak},{l:'Wounds',v:npc.woundThreshold},
          ...(npc.strainThreshold!=null?[{l:'Strain',v:npc.strainThreshold}]:[]),
          {l:'Def R',v:npc.defense.ranged},{l:'Def M',v:npc.defense.melee},
          ...(npc.forceRating?[{l:'Force',v:npc.forceRating}]:[]),
          ...(npc.adversary?[{l:'Adv',v:npc.adversary}]:[]),
        ].map(s=>(
          <div key={s.l} style={{textAlign:'center',minWidth:32}}>
            <div style={{fontSize:13,fontFamily:'var(--mono)',color:'var(--text-dim)',textTransform:'uppercase'}}>{s.l}</div>
            <div style={{fontSize:18,fontWeight:700,color:'var(--text-bright)',fontFamily:'var(--display)'}}>{s.v}</div>
          </div>
        ))}
      </div>
      {/* Skills */}
      <div style={{padding:'5px 12px',borderBottom:'1px solid var(--border)'}}>
        <div style={{fontSize:14,fontFamily:'var(--mono)',fontWeight:700,color:typeColor,marginBottom:3,textTransform:'uppercase',letterSpacing:'0.08em'}}>Skills</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:3}}>
          {npc.skills.map((s:any)=>(
            <span key={s.name} style={{fontFamily:'var(--mono)',fontSize:15,background:'rgba(255,255,255,0.05)',borderRadius:3,padding:'1px 5px',color:'var(--text-dim)'}}>
              {s.name} {s.rank}
            </span>
          ))}
        </div>
      </div>
      {/* Weapons */}
      <div style={{padding:'5px 12px',borderBottom:'1px solid var(--border)'}}>
        <div style={{fontSize:14,fontFamily:'var(--mono)',fontWeight:700,color:typeColor,marginBottom:3,textTransform:'uppercase',letterSpacing:'0.08em'}}>Weapons</div>
        {npc.weapons.map((w:any)=>(
          <div key={w.name} style={{fontSize:15,fontFamily:'var(--mono)',color:'var(--text-dim)',marginBottom:2,lineHeight:1.4}}>
            <span style={{color:'var(--text-bright)'}}>{w.name}</span>
            {' — '}Dmg {w.damage} | Crit {w.critical} | {w.range}{w.qualities?` | ${w.qualities}`:''}
          </div>
        ))}
      </div>
      {/* Talents */}
      {npc.talents.length>0 && (
        <div style={{padding:'5px 12px',borderBottom:'1px solid var(--border)'}}>
          <div style={{fontSize:14,fontFamily:'var(--mono)',fontWeight:700,color:typeColor,marginBottom:3,textTransform:'uppercase',letterSpacing:'0.08em'}}>Talents & Special Abilities</div>
          {[...npc.talents.map((t:any)=>({name:t.name,desc:t.desc})),...npc.abilities.map((a:any)=>({name:'',desc:a}))].map((t:any,i:number)=>(
            <div key={i} style={{fontSize:15,fontFamily:'var(--mono)',color:'var(--text-dim)',marginBottom:2,lineHeight:1.4}}>
              {t.name&&<span style={{color:'var(--text-bright)'}}>{t.name}: </span>}{t.desc}
            </div>
          ))}
        </div>
      )}
      {/* Equipment */}
      <div style={{padding:'5px 12px',borderBottom:'1px solid var(--border)'}}>
        <div style={{fontSize:14,fontFamily:'var(--mono)',fontWeight:700,color:typeColor,marginBottom:2,textTransform:'uppercase',letterSpacing:'0.08em'}}>Equipment</div>
        <div style={{fontSize:15,fontFamily:'var(--mono)',color:'var(--text-dim)',lineHeight:1.4}}>{npc.equipment}</div>
      </div>
      {/* Description */}
      <div style={{padding:'7px 12px',borderBottom:isGm?'1px solid var(--border)':'none'}}>
        <div style={{fontSize:16,color:'var(--text-dim)',lineHeight:1.55}}>{npc.desc}</div>
      </div>
      {/* GM Hook */}
      {isGm && (
        <div style={{padding:'7px 12px',background:'rgba(212,172,13,0.07)',borderTop:'1px solid rgba(212,172,13,0.25)'}}>
          <div style={{fontSize:14,fontFamily:'var(--mono)',fontWeight:700,color:'var(--gold)',marginBottom:3,textTransform:'uppercase',letterSpacing:'0.08em'}}>GM Hook</div>
          <div style={{fontSize:15,color:'rgba(212,172,13,0.85)',lineHeight:1.55}}>{npc.hook}</div>
        </div>
      )}
    </div>
  )
}
