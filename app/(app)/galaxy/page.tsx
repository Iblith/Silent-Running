'use client'
// app/(app)/galaxy/page.tsx

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useIsMobile } from '@/lib/ui'
import { LOCATIONS, LANES, TYPE_META, LOCATION_DATA, NPC_STATS } from '@/lib/gameData'
import { StatBlock } from '@/lib/stat-block'

// ─────────────────────────────────────────────────────────────────────────────
// LOCATION MODAL
// ─────────────────────────────────────────────────────────────────────────────
function LocationModal({ locId, isGm, onClose }: { locId: string; isGm: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('overview')
  const data = LOCATION_DATA[locId]
  const loc  = LOCATIONS.find(l => l.id === locId)
  if (!loc) return null
  const typeColor = TYPE_META[loc.type]?.color || '#ffa726'

  if (!data) {
    return (
      <div style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.88)',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={onClose}>
        <div style={{background:'var(--bg2)',border:`1px solid ${typeColor}`,borderRadius:8,padding:24,maxWidth:480,width:'92%'}} onClick={e=>e.stopPropagation()}>
          <div style={{fontFamily:'var(--display)',fontSize:21,color:typeColor,marginBottom:8}}>{loc.name}</div>
          <div style={{color:'var(--text-dim)',fontSize:15,lineHeight:1.6,marginBottom:16}}>{loc.desc}</div>
          <button onClick={onClose} style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:4,padding:'4px 16px',color:'var(--text-dim)',cursor:'pointer',fontFamily:'var(--display)',fontSize:15,fontWeight:600}}>Close</button>
        </div>
      </div>
    )
  }

  const tabs = [
    {id:'overview',label:'Overview'},
    ...(data.poi.length             ? [{id:'poi',   label:'Points of Interest'}] : []),
    ...(data.shops.length           ? [{id:'shops', label:'Shops & Services'}]   : []),
    ...(isGm && data.npcs.length    ? [{id:'npcs',  label:'People'}]             : []),
    ...(isGm && data.quests.length  ? [{id:'quests',label:'Missions'}]           : []),
    ...(isGm && data.dmNotes        ? [{id:'dm',    label:'⚙ DM Notes'}]         : []),
  ]

  return (
    <div style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.88)',display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'28px 12px',overflowY:'auto'}} onClick={onClose}>
      <div style={{background:'var(--bg2)',border:`1px solid ${typeColor}`,borderRadius:8,width:'min(860px,98vw)',display:'flex',flexDirection:'column',maxHeight:'calc(100vh - 56px)',overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{borderBottom:`2px solid ${typeColor}`,padding:'14px 18px',display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
          <div style={{flex:1}}>
            <div style={{fontFamily:'var(--display)',fontWeight:700,fontSize:23,color:typeColor,letterSpacing:'0.05em'}}>{loc.name}</div>
            <div style={{fontSize:15,fontFamily:'var(--mono)',color:'var(--text-dim)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:2}}>
              {TYPE_META[loc.type]?.label}
              {loc.ly   ? `  ·  ${loc.ly} ly from base` : ''}
              {loc.threat ? `  ·  ${loc.threat}` : ''}
            </div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'1px solid var(--border)',borderRadius:4,color:'var(--text-dim)',fontSize:21,lineHeight:1,cursor:'pointer',width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>×</button>
        </div>
        {/* Tabs */}
        <div style={{display:'flex',borderBottom:'1px solid var(--border)',flexShrink:0,overflowX:'auto'}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)}
              style={{padding:'9px 15px',border:'none',background:'none',cursor:'pointer',
                     fontFamily:'var(--display)',fontSize:15,fontWeight:600,letterSpacing:'0.06em',
                     color:activeTab===t.id?typeColor:'var(--text-dim)',
                     borderBottom:activeTab===t.id?`2px solid ${typeColor}`:'2px solid transparent',
                     whiteSpace:'nowrap',transition:'color 0.15s'}}>
              {t.label}
            </button>
          ))}
        </div>
        {/* Content */}
        <div style={{flex:1,overflowY:'auto',padding:18}}>
          {activeTab==='overview' && (
            <div>
              <p style={{fontSize:16,color:'var(--text-bright)',lineHeight:1.75,marginBottom:14}}>{data.overview}</p>
              <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid var(--border)',borderRadius:6,padding:12}}>
                <div style={{fontSize:14,fontFamily:'var(--mono)',fontWeight:700,color:typeColor,marginBottom:5,textTransform:'uppercase',letterSpacing:'0.08em'}}>Atmosphere</div>
                <p style={{fontSize:15,color:'var(--text-dim)',lineHeight:1.65,fontStyle:'italic',margin:0}}>{data.atmosphere}</p>
              </div>
            </div>
          )}
          {activeTab==='poi' && (
            <div>
              {data.poi.map((p:any)=>(
                <div key={p.name} style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,padding:12,marginBottom:10}}>
                  <div style={{fontFamily:'var(--display)',fontWeight:600,fontSize:16,color:typeColor,marginBottom:4}}>{p.name}</div>
                  <div style={{fontSize:15,color:'var(--text-dim)',lineHeight:1.55}}>{p.desc}</div>
                </div>
              ))}
            </div>
          )}
          {activeTab==='shops' && (
            <div>
              {data.shops.map((s:any)=>(
                <div key={s.name} style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,padding:12,marginBottom:10}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,marginBottom:4}}>
                    <div style={{fontFamily:'var(--display)',fontWeight:600,fontSize:16,color:typeColor}}>{s.name}</div>
                    <span style={{fontSize:14,fontFamily:'var(--mono)',letterSpacing:'0.08em',textTransform:'uppercase',background:'rgba(255,255,255,0.05)',borderRadius:3,padding:'2px 6px',color:'var(--text-dim)',flexShrink:0}}>{s.type}</span>
                  </div>
                  <div style={{fontSize:15,color:'var(--text-dim)',lineHeight:1.55,marginBottom:s.inventory?8:0}}>{s.desc}</div>
                  {s.inventory && (
                    <div style={{background:'rgba(0,0,0,0.25)',borderRadius:4,padding:'6px 10px'}}>
                      <div style={{fontSize:14,fontFamily:'var(--mono)',fontWeight:700,color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:3}}>Sample Inventory</div>
                      <div style={{fontSize:16,fontFamily:'var(--mono)',color:'var(--text-dim)',lineHeight:1.6}}>{s.inventory}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {activeTab==='npcs' && (
            <div>
              {data.npcs.map((n:any)=>(
                <div key={n.key}>
                  {NPC_STATS[n.key] ? (
                    <StatBlock npcKey={n.key} isGm={isGm} />
                  ) : (
                    <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,padding:12,marginBottom:12}}>
                      <div style={{fontFamily:'var(--display)',fontWeight:600,fontSize:16,color:typeColor,marginBottom:2}}>{n.name}</div>
                      <div style={{fontSize:15,fontFamily:'var(--mono)',color:'var(--text-dim)',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.08em'}}>{n.role}</div>
                      <div style={{fontSize:15,color:'var(--text-dim)',lineHeight:1.55}}>{n.desc}</div>
                      {isGm && n.hook && (
                        <div style={{marginTop:8,padding:'6px 10px',background:'rgba(212,172,13,0.07)',borderRadius:4,borderTop:'1px solid rgba(212,172,13,0.25)'}}>
                          <div style={{fontSize:14,fontFamily:'var(--mono)',fontWeight:700,color:'var(--gold)',marginBottom:2,textTransform:'uppercase',letterSpacing:'0.08em'}}>GM Hook</div>
                          <div style={{fontSize:15,color:'rgba(212,172,13,0.85)',lineHeight:1.5}}>{n.hook}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {activeTab==='quests' && (
            <div>
              {data.quests.map((q:any)=>(
                <div key={q.name} style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,padding:12,marginBottom:10}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,marginBottom:5}}>
                    <div style={{fontFamily:'var(--display)',fontWeight:600,fontSize:16,color:typeColor}}>{q.name}</div>
                    <span style={{fontSize:14,fontFamily:'var(--mono)',letterSpacing:'0.08em',textTransform:'uppercase',background:'rgba(255,255,255,0.05)',borderRadius:3,padding:'2px 6px',color:'var(--text-dim)',flexShrink:0}}>{q.type}</span>
                  </div>
                  <div style={{fontSize:15,fontFamily:'var(--mono)',color:'var(--text-dim)',marginBottom:6}}>Difficulty: {q.difficulty} · Reward: {q.reward}</div>
                  <div style={{fontSize:15,color:'var(--text-dim)',lineHeight:1.55}}>{q.desc}</div>
                  {isGm && (
                    <div style={{marginTop:8,padding:'7px 10px',background:'rgba(212,172,13,0.07)',borderRadius:4,borderTop:'1px solid rgba(212,172,13,0.25)'}}>
                      <div style={{fontSize:14,fontFamily:'var(--mono)',fontWeight:700,color:'var(--gold)',marginBottom:3,textTransform:'uppercase',letterSpacing:'0.08em'}}>GM Hook</div>
                      <div style={{fontSize:15,color:'rgba(212,172,13,0.85)',lineHeight:1.55}}>{q.gmHook}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {activeTab==='dm' && isGm && data.dmNotes && (
            <div style={{background:'rgba(212,172,13,0.07)',border:'1px solid rgba(212,172,13,0.3)',borderRadius:6,padding:16}}>
              <div style={{fontSize:14,fontFamily:'var(--mono)',fontWeight:700,color:'var(--gold)',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.08em'}}>DM Notes — {loc.name}</div>
              <div style={{fontSize:15,color:'rgba(212,172,13,0.88)',lineHeight:1.75}}>{data.dmNotes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GALAXY MAP
// ─────────────────────────────────────────────────────────────────────────────
function GalaxyMap({ showHidden, isGm, onToggleHidden }: { showHidden: boolean; isGm: boolean; onToggleHidden?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selected, setSelected]       = useState<string|null>(null)
  const [hover, setHover]             = useState<string|null>(null)
  const [pan, setPan]                 = useState({x:0,y:0})
  const [zoom, setZoom]               = useState(1)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [modalLocId, setModalLocId]   = useState<string|null>(null)
  const isMobile = useIsMobile()
  const dragging      = useRef(false)
  const lastMouse     = useRef<{x:number,y:number}|null>(null)
  const dragDist      = useRef(0)
  const lastPinchDist = useRef<number|null>(null)
  const starsRef      = useRef<any[]|null>(null)

  const isHidden = (loc:any) => (loc.type==='hidden'||loc.type==='command') && !showHidden
  const toScreen = (x:number,y:number) => ({x:x*zoom+pan.x, y:y*zoom+pan.y})
  const toWorld  = (x:number,y:number) => ({x:(x-pan.x)/zoom, y:(y-pan.y)/zoom})

  function draw() {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    ctx.fillStyle = '#050a14'; ctx.fillRect(0,0,W,H)

    if (!starsRef.current) {
      starsRef.current = Array.from({length:400},()=>({
        x:Math.random()*1800,y:Math.random()*1200,
        r:Math.random()*1.2+0.2,a:Math.random()*0.55+0.15
      }))
    }
    starsRef.current.forEach(s => {
      const sx=s.x*zoom+pan.x,sy=s.y*zoom+pan.y
      if(sx<-2||sx>W+2||sy<-2||sy>H+2) return
      ctx.beginPath(); ctx.arc(sx,sy,s.r,0,Math.PI*2)
      ctx.fillStyle=`rgba(200,210,255,${s.a})`; ctx.fill()
    })

    LANES.forEach((l:any) => {
      const a=LOCATIONS.find(n=>n.id===l.a), b=LOCATIONS.find(n=>n.id===l.b)
      if(!a||!b) return
      if(!showHidden && (isHidden(a)||isHidden(b))) return
      const sa=toScreen(a.x,a.y), sb=toScreen(b.x,b.y)
      ctx.save(); ctx.beginPath(); ctx.moveTo(sa.x,sa.y); ctx.lineTo(sb.x,sb.y)
      if (l.h||l.c) { ctx.setLineDash([5,9]); ctx.strokeStyle='rgba(35,58,105,0.6)'; ctx.lineWidth=1 }
      else          { ctx.setLineDash([]);     ctx.strokeStyle='rgba(55,92,168,0.5)'; ctx.lineWidth=1.5 }
      if (selected&&(l.a===selected||l.b===selected)) {
        ctx.strokeStyle='rgba(212,172,13,0.5)'; ctx.lineWidth=2.5; ctx.setLineDash([])
      }
      ctx.stroke(); ctx.restore()
      if (zoom>0.9 && !isHidden(a) && !isHidden(b)) {
        const dx=a.x-b.x,dy=a.y-b.y
        const dist=Math.round(Math.sqrt(dx*dx+dy*dy)*0.32)
        if (dist>0) {
          const mx=(sa.x+sb.x)/2, my=(sa.y+sb.y)/2
          ctx.save(); ctx.font=`${Math.round(11*Math.min(zoom,1.4))}px Share Tech Mono`
          ctx.fillStyle='rgba(72,100,158,0.8)'; ctx.textAlign='center'
          ctx.fillText(`${dist} ly`,mx,my-4); ctx.restore()
        }
      }
    })

    LOCATIONS.filter(n=>n.type==='hazard').forEach(n => {
      const s=toScreen(n.x,n.y), r=50*zoom
      ctx.save(); ctx.beginPath(); ctx.arc(s.x,s.y,r,0,Math.PI*2)
      ctx.fillStyle='rgba(55,88,170,0.07)'; ctx.strokeStyle='rgba(55,88,170,0.28)'
      ctx.lineWidth=1.5; ctx.setLineDash([4,6]); ctx.fill(); ctx.stroke(); ctx.restore()
    })

    LOCATIONS.filter(n=>n.type!=='hazard').forEach(n => {
      const T = TYPE_META[n.type]; if (!T) return
      const hidden = isHidden(n)
      const s = toScreen(n.x,n.y)
      const r = (n.type==='home'?14:n.type==='command'?12:11)*zoom
      if (hidden) {
        ctx.save(); ctx.beginPath(); ctx.arc(s.x,s.y,r*0.7,0,Math.PI*2)
        ctx.strokeStyle='rgba(171,71,188,0.35)'; ctx.lineWidth=1; ctx.setLineDash([3,4]); ctx.stroke()
        if (zoom>0.75) {
          ctx.font=`${Math.round(13*zoom)}px Share Tech Mono`
          ctx.fillStyle='rgba(171,71,188,0.45)'; ctx.textAlign='center'
          ctx.fillText('?',s.x,s.y+4)
        }
        ctx.restore(); return
      }
      if (selected===n.id||hover===n.id) {
        ctx.save(); ctx.beginPath(); ctx.arc(s.x,s.y,r+5*zoom,0,Math.PI*2)
        ctx.strokeStyle=selected===n.id?'#D4AC0D':'rgba(255,255,255,0.22)'
        ctx.lineWidth=selected===n.id?2:1; ctx.stroke(); ctx.restore()
      }
      ctx.save(); ctx.beginPath(); ctx.arc(s.x,s.y,r,0,Math.PI*2)
      ctx.fillStyle=T.color; ctx.fill()
      ctx.strokeStyle='rgba(0,0,0,0.4)'; ctx.lineWidth=1.5; ctx.stroke(); ctx.restore()
      if (zoom>0.55) {
        const fz=Math.max(13,Math.round(14*Math.min(zoom,1.6)))
        ctx.save(); ctx.font=`600 ${fz}px Exo 2`; ctx.textAlign='center'
        ctx.fillStyle=n.type==='home'?'#4fc3f7':n.type==='command'?'#00e5ff':'rgba(188,202,228,0.9)'
        ctx.fillText(n.name,s.x,s.y+r+13)
        if (zoom>0.85&&n.ly) {
          ctx.font=`${Math.max(12,Math.round(12*zoom))}px Share Tech Mono`
          ctx.fillStyle='rgba(110,130,172,0.7)'
          ctx.fillText(`${n.ly} ly`,s.x,s.y+r+24)
        }
        ctx.restore()
      }
    })

    LOCATIONS.filter(n=>n.type==='hazard').forEach(n => {
      if (zoom>0.55) {
        const s=toScreen(n.x,n.y),r=50*zoom
        ctx.save(); ctx.font=`${Math.max(13,Math.round(13*zoom))}px Exo 2`
        ctx.fillStyle='rgba(240,98,146,0.65)'; ctx.textAlign='center'
        ctx.fillText(n.name,s.x,s.y+r+13); ctx.restore()
      }
    })
  }

  useEffect(() => { draw() }, [pan,zoom,selected,hover,showHidden])

  useEffect(() => {
    const c = canvasRef.current; if (!c) return
    const canvas: HTMLCanvasElement = c
    const parent = canvas.parentElement!

    function doResize() {
      canvas.width  = parent.clientWidth
      canvas.height = parent.clientHeight
      draw()
    }

    // rAF ensures the browser has finished layout before we measure
    const raf = requestAnimationFrame(doResize)

    // ResizeObserver catches orientation changes and flex/layout shifts
    const ro = new ResizeObserver(doResize)
    ro.observe(parent)

    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [])

  function nodeAt(wx:number,wy:number) {
    let best:any=null, bestD=Infinity
    LOCATIONS.forEach(n => {
      if (isHidden(n)) return
      const r = n.type==='hazard'?50:n.type==='home'?14:11
      const dx=wx-n.x,dy=wy-n.y,d=Math.sqrt(dx*dx+dy*dy)
      if (d<r+8&&d<bestD){bestD=d;best=n}
    })
    return best
  }

  const selLoc     = LOCATIONS.find(l=>l.id===selected)
  const showSidebar = isMobile ? sidebarOpen : true

  return (
    <div style={{height:'100%',display:'flex',position:'relative'}}>
      {/* Canvas */}
      <div style={{flex:1,position:'relative',overflow:'hidden',
                   background:'radial-gradient(ellipse at 30% 50%, rgba(10,20,40,0.8) 0%, #04060C 70%)'}}>
        <canvas ref={canvasRef}
          style={{cursor:dragging.current?'grabbing':'grab',display:'block',width:'100%',height:'100%',touchAction:'none'}}
          onMouseDown={e=>{dragging.current=false;dragDist.current=0;lastMouse.current={x:e.clientX,y:e.clientY}}}
          onMouseMove={e=>{
            if(lastMouse.current){
              const dx=e.clientX-lastMouse.current.x,dy=e.clientY-lastMouse.current.y
              dragDist.current+=Math.abs(dx)+Math.abs(dy)
              if(dragDist.current>4)dragging.current=true
              if(dragging.current){setPan(p=>({x:p.x+dx,y:p.y+dy}));lastMouse.current={x:e.clientX,y:e.clientY}}
            }
            const rect=canvasRef.current!.getBoundingClientRect()
            const w=toWorld(e.clientX-rect.left,e.clientY-rect.top)
            setHover(nodeAt(w.x,w.y)?.id||null)
          }}
          onMouseUp={e=>{
            if(!dragging.current){
              const rect=canvasRef.current!.getBoundingClientRect()
              const w=toWorld(e.clientX-rect.left,e.clientY-rect.top)
              const n=nodeAt(w.x,w.y)
              setSelected(n?(n.id===selected?null:n.id):null)
            }
            dragging.current=false;lastMouse.current=null
          }}
          onMouseLeave={()=>{setHover(null);dragging.current=false;lastMouse.current=null}}
          onWheel={e=>{
            e.preventDefault()
            const rect=canvasRef.current!.getBoundingClientRect()
            const mx=e.clientX-rect.left,my=e.clientY-rect.top
            const f=e.deltaY<0?1.12:0.89
            setPan(p=>({x:mx-(mx-p.x)*f,y:my-(my-p.y)*f}))
            setZoom(z=>Math.min(3,Math.max(0.35,z*f)))
          }}
          onTouchStart={e=>{
            e.preventDefault()
            if(e.touches.length===1){
              dragging.current=false;dragDist.current=0
              lastMouse.current={x:e.touches[0].clientX,y:e.touches[0].clientY}
            } else if(e.touches.length===2){
              lastPinchDist.current=Math.hypot(
                e.touches[1].clientX-e.touches[0].clientX,
                e.touches[1].clientY-e.touches[0].clientY
              )
            }
          }}
          onTouchMove={e=>{
            e.preventDefault()
            if(e.touches.length===1&&lastMouse.current){
              const dx=e.touches[0].clientX-lastMouse.current.x
              const dy=e.touches[0].clientY-lastMouse.current.y
              dragDist.current+=Math.abs(dx)+Math.abs(dy)
              if(dragDist.current>4)dragging.current=true
              if(dragging.current){
                setPan(p=>({x:p.x+dx,y:p.y+dy}))
                lastMouse.current={x:e.touches[0].clientX,y:e.touches[0].clientY}
              }
            } else if(e.touches.length===2&&lastPinchDist.current!==null){
              const dist=Math.hypot(
                e.touches[1].clientX-e.touches[0].clientX,
                e.touches[1].clientY-e.touches[0].clientY
              )
              const f=dist/lastPinchDist.current
              const rect=canvasRef.current!.getBoundingClientRect()
              const cx=(e.touches[0].clientX+e.touches[1].clientX)/2-rect.left
              const cy=(e.touches[0].clientY+e.touches[1].clientY)/2-rect.top
              setPan(p=>({x:cx-(cx-p.x)*f,y:cy-(cy-p.y)*f}))
              setZoom(z=>Math.min(3,Math.max(0.35,z*f)))
              lastPinchDist.current=dist
            }
          }}
          onTouchEnd={e=>{
            if(!dragging.current&&e.changedTouches.length===1&&e.touches.length===0){
              const rect=canvasRef.current!.getBoundingClientRect()
              const t=e.changedTouches[0]
              const w=toWorld(t.clientX-rect.left,t.clientY-rect.top)
              const n=nodeAt(w.x,w.y)
              setSelected(n?(n.id===selected?null:n.id):null)
              if(isMobile&&n) setSidebarOpen(true)
            }
            if(e.touches.length===0){dragging.current=false;lastMouse.current=null;lastPinchDist.current=null}
          }}
        />
        {isMobile && (
          <button onClick={()=>setSidebarOpen(o=>!o)}
            style={{position:'absolute',bottom:68,right:16,width:44,height:44,borderRadius:'50%',
                    background:'var(--panel)',border:'1px solid var(--border2)',
                    color:'var(--gold)',fontSize:21,display:'flex',alignItems:'center',
                    justifyContent:'center',zIndex:10,boxShadow:'0 2px 12px rgba(0,0,0,0.6)'}}>
            ☰
          </button>
        )}
      </div>

      {/* Sidebar */}
      {showSidebar && (
        <div style={isMobile ? {
          position:'absolute',inset:0,zIndex:20,background:'var(--bg2)',
          display:'flex',flexDirection:'column',overflow:'hidden'
        } : {
          width:300,flexShrink:0,background:'var(--bg2)',
          borderLeft:'1px solid var(--border)',display:'flex',flexDirection:'column',overflow:'hidden'
        }}>
          <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)',
                       display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{fontFamily:'var(--display)',fontSize:16,fontWeight:700,
                         letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gold)'}}>
              Navigation Data
            </div>
            {isGm && !isMobile && (
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <div onClick={()=>onToggleHidden?.()}
                  style={{width:32,height:18,borderRadius:9,cursor:'pointer',transition:'background 0.2s',
                          background:showHidden?'var(--purple)':'rgba(255,255,255,0.1)',
                          border:`1px solid ${showHidden?'var(--purple-bright)':'var(--border)'}`,
                          position:'relative'}}>
                  <div style={{width:12,height:12,borderRadius:'50%',background:'white',position:'absolute',
                               top:2,transition:'left 0.2s',left:showHidden?16:2}}/>
                </div>
                <span style={{fontFamily:'var(--mono)',fontSize:14,color:'var(--text-dim)'}}>Hidden</span>
              </div>
            )}
            {isMobile && (
              <button onClick={()=>setSidebarOpen(false)}
                style={{background:'none',border:'none',color:'var(--text-dim)',fontSize:23,cursor:'pointer',lineHeight:1}}>
                ×
              </button>
            )}
          </div>
          <div style={{flex:1,overflowY:'auto',padding:12}}>
            {!isMobile && (
              <p style={{fontSize:16,color:'var(--text-dim)',fontFamily:'var(--mono)',marginBottom:12,lineHeight:1.6}}>
                Click a node to select. Scroll to zoom. Drag to pan.
              </p>
            )}
            {selLoc && (
              <div style={{background:'rgba(212,172,13,0.06)',border:'1px solid rgba(212,172,13,0.4)',
                           borderRadius:6,padding:12,marginBottom:12}}>
                <div style={{fontFamily:'var(--display)',fontSize:17,fontWeight:600,color:'var(--text-bright)',marginBottom:4}}>
                  {selLoc.name}
                </div>
                <div style={{fontSize:15,fontFamily:'var(--mono)',letterSpacing:'0.1em',textTransform:'uppercase',
                             color:TYPE_META[selLoc.type]?.color,marginBottom:6}}>
                  {TYPE_META[selLoc.type]?.label}
                </div>
                <div style={{fontSize:16,color:'var(--text-dim)',lineHeight:1.5,marginBottom:8}}>{selLoc.desc}</div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {selLoc.ly && (
                    <span style={{fontFamily:'var(--mono)',fontSize:15,background:'rgba(255,255,255,0.06)',
                                  borderRadius:3,padding:'2px 6px',color:'var(--text-dim)'}}>
                      {selLoc.ly} ly
                    </span>
                  )}
                  <span style={{fontFamily:'var(--mono)',fontSize:15,background:'rgba(255,100,100,0.08)',
                                borderRadius:3,padding:'2px 6px',color:'rgba(255,120,120,0.8)'}}>
                    {selLoc.threat}
                  </span>
                </div>
                {(LOCATION_DATA[selLoc.id] || true) && (
                  <button onClick={()=>setModalLocId(selLoc.id)}
                    style={{marginTop:8,width:'100%',background:'rgba(212,172,13,0.1)',
                            border:'1px solid rgba(212,172,13,0.5)',borderRadius:4,padding:'7px',
                            color:'var(--gold)',fontFamily:'var(--display)',fontSize:16,
                            fontWeight:700,letterSpacing:'0.08em',cursor:'pointer',transition:'background 0.15s'}}>
                    View Details
                  </button>
                )}
              </div>
            )}
            <div style={{fontSize:16,color:'var(--text-dim)',fontFamily:'var(--display)',fontWeight:700,
                         letterSpacing:'0.1em',textTransform:'uppercase',marginTop:8,marginBottom:8}}>
              All Locations
            </div>
            {LOCATIONS.filter(l=>l.type!=='hazard'&&(!isHidden(l))).map(loc=>(
              <div key={loc.id}
                onClick={()=>{setSelected(loc.id===selected?null:loc.id);if(isMobile)setSidebarOpen(false)}}
                style={{background:selected===loc.id?'rgba(212,172,13,0.06)':'var(--panel)',
                        border:`1px solid ${selected===loc.id?'rgba(212,172,13,0.4)':'var(--border)'}`,
                        borderRadius:6,padding:'8px 10px',marginBottom:5,cursor:'pointer',transition:'all 0.2s'}}>
                <div style={{fontFamily:'var(--display)',fontSize:15,fontWeight:600,color:'var(--text-bright)',marginBottom:2}}>
                  {loc.name}
                </div>
                <div style={{fontSize:14,fontFamily:'var(--mono)',letterSpacing:'0.1em',textTransform:'uppercase',
                             color:TYPE_META[loc.type]?.color}}>
                  {TYPE_META[loc.type]?.label}
                  {loc.ly ? `  ·  ${loc.ly} ly` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {modalLocId && <LocationModal locId={modalLocId} isGm={isGm} onClose={()=>setModalLocId(null)} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function GalaxyPage() {
  const { user } = useAuth()
  const [showHidden, setShowHidden] = useState(false)
  const isGm = user?.role === 'gm'

  return <GalaxyMap showHidden={isGm && showHidden} isGm={!!isGm} onToggleHidden={()=>setShowHidden(h=>!h)} />
}
