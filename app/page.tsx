'use client'
import { useState, useEffect, useRef } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const CHAR_COLORS = ['#2E86C1','#1E8449','#C0392B','#6C3483','#D4AC0D','#E67E22','#17A589']

const SKILL_CHAR: Record<string,string> = {
  'Astrogation':'Int','Athletics':'Br','Brawl':'Br','Charm':'Pr','Coercion':'Wi',
  'Computers':'Int','Cool':'Pr','Coordination':'Ag','Deception':'Cu','Discipline':'Wi',
  'Gunnery':'Ag','Leadership':'Pr','Mechanics':'Int','Medicine':'Int','Melee':'Br',
  'Perception':'Cu','Piloting (Planetary)':'Ag','Piloting (Space)':'Ag',
  'Ranged (Heavy)':'Ag','Ranged (Light)':'Ag','Resilience':'Br','Skulduggery':'Cu',
  'Stealth':'Ag','Streetwise':'Cu','Survival':'Cu','Vigilance':'Wi',
}

const CHAR_ABBR: Record<string,string> = {
  Brawn:'Br',Agility:'Ag',Intellect:'Int',Cunning:'Cu',Willpower:'Wi',Presence:'Pr'
}
const CHAR_KEYS = ['Brawn','Agility','Intellect','Cunning','Willpower','Presence']

const DEFAULT_SKILLS = Object.fromEntries(Object.keys(SKILL_CHAR).map(k=>[k,0]))

const DEFAULT_CHAR = {
  id:'', name:'New Character', player:'', species:'', career:'', specialisation:'',
  colorIdx:0,
  characteristics:{Brawn:2,Agility:2,Intellect:2,Cunning:2,Willpower:2,Presence:2},
  wounds:0, woundThreshold:12, strain:0, strainThreshold:12,
  soak:2, defense:0, forceRating:0, duty:0, dutyType:'', morality:50,
  skills:{...DEFAULT_SKILLS},
  talents:[] as any[], weapons:[] as any[], equipment:[] as any[],
  notes:'', xp:0, totalXp:0,
}

const INITIAL_CAMPAIGN = {
  session:1, heatLevel:0, renausTrack:0, mercyCount:0, expedCount:0,
  ht:0, sst:0, stealthActive:false,
  missionStatus:{} as Record<string,string>,
  shipUpgrades:{} as Record<string,boolean>,
  gmNotes:'',
}

const MISSIONS = [
  {id:'m11',name:'1-1  Dark Cargo',         act:'I',  duty:'5+',  sessions:1},
  {id:'m12',name:'1-2  Ghost Light',         act:'I',  duty:'8',   sessions:1},
  {id:'m13',name:'1-3  Cold Extraction',     act:'I',  duty:'10+', sessions:2},
  {id:'m21',name:'2-1  The Hammer Falls',    act:'II', duty:'15+', sessions:2},
  {id:'m22',name:'2-2  Deep Water',          act:'II', duty:'12+', sessions:2},
  {id:'m23',name:'2-3  Signal in the Dark',  act:'II', duty:'20',  sessions:1},
  {id:'m3f',name:'3-F  Installation Omega',  act:'III',duty:'50',  sessions:4},
]

const SHIP_UPGRADES = [
  {id:'cool1', name:'Improved Cooling',       cost:5,  branch:'A'},
  {id:'mask1', name:'Sensor Mask',            cost:10, branch:'A'},
  {id:'ext1',  name:'Extended Crystal Array', cost:10, branch:'A'},
  {id:'ecm1',  name:'Passive ECM Suite',      cost:15, branch:'A'},
  {id:'ghost1',name:'Sensor Ghost Emitters',  cost:20, branch:'A'},
  {id:'sfire1',name:'Silent Firing Mode',     cost:20, branch:'A'},
  {id:'cloak1',name:'Full Spectrum Cloak',    cost:30, branch:'A'},
  {id:'ion1',  name:'Ion Cannon (Forward)',   cost:10, branch:'B'},
  {id:'pdf1',  name:'Point Defence Network',  cost:10, branch:'B'},
  {id:'hull1', name:'Reinforced Hull Plating',cost:15, branch:'B'},
  {id:'turbo1',name:'Dorsal Turbolaser',      cost:20, branch:'B'},
  {id:'cap1',  name:'Capital-Class Shields',  cost:30, branch:'B'},
  {id:'jump1', name:'Emergency Jump Caps.',   cost:20, branch:'E'},
  {id:'hyper1',name:'Hyperdrive ×0.5',        cost:10, branch:'E'},
  {id:'han1',  name:'Basic Hangar Bay (1)',   cost:15, branch:'F'},
  {id:'han2',  name:'Expanded Hangar (2)',    cost:15, branch:'F'},
  {id:'han3',  name:'Full Wing Bay (4)',       cost:20, branch:'F'},
  {id:'stealth_han',name:'Stealth Hangar Shielding',cost:10,branch:'F'},
]

const LOCATIONS = [
  {id:'base',    name:"Kal'Shara Station",       type:'home',    x:170,y:420,ly:null,   threat:'Minimal',              desc:"The Phantom Tide's mobile base. Decommissioned ore platform. Hidden."},
  {id:'alpha',   name:'Haven Alpha',             type:'command', x:285,y:480,ly:22,     threat:'Hidden — Heat ≤ 3',    desc:'Mon Calamari cruiser Steadfast Resolve. Alliance command post.'},
  {id:'beta',    name:'Haven Beta',              type:'command', x:228,y:536,ly:55,     threat:'Unknown to Empire',    desc:'Fallback command node. Sullust tunnel network.'},
  {id:'ryloth',  name:'Ryloth',                  type:'rebel',   x:318,y:355,ly:38,     threat:'Moderate garrison',    desc:'Cell WRAITH. Mission 1-1 delivery point.'},
  {id:'sullust', name:'Sullust',                 type:'rebel',   x:248,y:505,ly:51,     threat:'Imperial blockade',    desc:'Volcanic world. SoroSuub workers.'},
  {id:'typhojem',name:'Typhojem Station',        type:'imperial',x:448,y:238,ly:98,     threat:'Medium — 40 personnel',desc:'Customs waystation. Lt. Osk. Bio-scanner. Mission 1-1 checkpoint.'},
  {id:'derrilyn',name:'Derrilyn Station',        type:'imperial',x:590,y:338,ly:119,    threat:'High — TIE patrols',   desc:'KDY fuel depot. 400 workers. Mission 2-1 target.'},
  {id:'kessel',  name:'Kessel',                  type:'imperial',x:110,y:348,ly:22,     threat:'Very high — prison',   desc:'Spice mines. Political prisoners.'},
  {id:'eriadu',  name:'Sector Command: Eriadu',  type:'imperial',x:668,y:452,ly:188,    threat:'Maximum',              desc:'Regional Imperial hub. Grand Moff. ISB HQ.'},
  {id:'corellia',name:'Corellia',                type:'neutral', x:538,y:208,ly:142,    threat:'Heavy Imperial',       desc:'Shadow docks. ISB Sollus. Black market.'},
  {id:'ordmant', name:'Ord Mantell',             type:'neutral', x:408,y:298,ly:67,     threat:'Moderate — bounty',    desc:"Junkyard world. Varro's territory. Mission 1-3 prison break."},
  {id:'naboo',   name:'Naboo',                   type:'neutral', x:528,y:398,ly:88,     threat:'Low garrison',         desc:'Mission 2-2 Tessek assassination. Lira Tessek.'},
  {id:'rodia',   name:'Rodia',                   type:'neutral', x:308,y:462,ly:42,     threat:'Moderate — hunters',   desc:'Rodian homeworld. Underworld contacts.'},
  {id:'reaper',  name:"Reaper's Drift",          type:'pirate',  x:138,y:268,ly:18,     threat:'Pirate gangs',         desc:'Three gangs. No Imperial patrols. Kel Vane arms dealer.'},
  {id:'smugrun', name:"Smuggler's Run",          type:'pirate',  x:468,y:148,ly:108,    threat:'Syndicate enforcers',  desc:'Asteroid maze. Corellian Syndicate toll.'},
  {id:'terminus',name:'Terminus Station',        type:'pirate',  x:72, y:488,ly:34,     threat:'Unpredictable',        desc:'Drax Solenne. Secret Endor route. Last stop before Wild Space.'},
  {id:'relay',   name:'Relay Station AR-7',      type:'hidden',  x:208,y:308,ly:29,     threat:'Ghost station',        desc:'12 dead crew. LAZARUS files. Mission 2-3.'},
  {id:'endor',   name:'Endor (Forest Moon)',     type:'hidden',  x:138,y:535,ly:44,     threat:'Maximum — AT-ATs',     desc:'Installation Omega. Project LAZARUS. Act III climax.'},
  {id:'hammer',  name:'ISD Hammer of Patience',  type:'hidden',  x:482,y:168,ly:null,   threat:'Nemesis-level',        desc:'Captain Renaus. Active pursuit at Heat 4+.'},
  {id:'kwenn',   name:'Kwenn Space Station',     type:'waypoint',x:368,y:438,ly:55,     threat:'Low — surveillance',   desc:'Major junction. Fuel. Thrice the info broker.'},
  {id:'maw',     name:'Maw Approach Nebula',     type:'hazard',  x:88, y:285,ly:null,   threat:'Navigation hazard',    desc:'Ion nebula. Ships disappear. Smuggler cover.'},
  {id:'debris',  name:'Derrilyn Debris Belt',    type:'hazard',  x:628,y:308,ly:null,   threat:'Environmental',        desc:'Asteroid belt. Post-mission: Derrilyn wreckage joins.'},
] as const

const LANES = [
  {a:'base',b:'kessel'}, {a:'base',b:'relay'}, {a:'base',b:'ryloth'}, {a:'base',b:'reaper'}, {a:'base',b:'terminus'},
  {a:'alpha',b:'sullust'}, {a:'alpha',b:'ryloth'}, {a:'beta',b:'sullust'}, {a:'beta',b:'endor',h:true},
  {a:'ryloth',b:'ordmant'}, {a:'ryloth',b:'kwenn'}, {a:'ryloth',b:'sullust'}, {a:'ryloth',b:'rodia'},
  {a:'sullust',b:'kwenn'}, {a:'sullust',b:'endor',h:true},
  {a:'kwenn',b:'rodia'}, {a:'kwenn',b:'naboo'}, {a:'kwenn',b:'ordmant'},
  {a:'ordmant',b:'typhojem'}, {a:'typhojem',b:'corellia'},
  {a:'corellia',b:'naboo'}, {a:'corellia',b:'smugrun',h:true},
  {a:'naboo',b:'derrilyn'}, {a:'derrilyn',b:'eriadu'}, {a:'derrilyn',b:'typhojem'},
  {a:'relay',b:'ryloth',h:true}, {a:'relay',b:'kessel',h:true},
  {a:'reaper',b:'kessel'}, {a:'reaper',b:'maw'},
  {a:'smugrun',b:'ordmant'}, {a:'smugrun',b:'typhojem'},
  {a:'terminus',b:'endor',h:true}, {a:'terminus',b:'sullust'},
  {a:'maw',b:'kessel'}, {a:'eriadu',b:'naboo'},
  {a:'hammer',b:'typhojem',h:true}, {a:'hammer',b:'corellia',h:true},
  {a:'alpha',b:'base',c:true}, {a:'beta',b:'base',c:true},
] as any[]

const TYPE_META: Record<string,{color:string,label:string}> = {
  home:    {color:'#4fc3f7',label:'Homebase'},
  rebel:   {color:'#66bb6a',label:'Rebel Cell'},
  command: {color:'#00e5ff',label:'Alliance Command'},
  imperial:{color:'#ef5350',label:'Imperial Garrison'},
  neutral: {color:'#ffa726',label:'Neutral / Trading'},
  pirate:  {color:'#ff7043',label:'Pirate Haven'},
  hidden:  {color:'#ab47bc',label:'Hidden Installation'},
  waypoint:{color:'#78909c',label:'Waypoint / Fuel'},
  hazard:  {color:'#f06292',label:'Hazard Zone'},
}

// ─────────────────────────────────────────────────────────────────────────────
// DICE ENGINE
// ─────────────────────────────────────────────────────────────────────────────
const DIE_FACES: Record<string,any[][]> = {
  ability:     [[],[],[{s:1}],[{s:1}],[{s:2}],[{a:1}],[{s:1,a:1}],[{a:2}]],
  proficiency: [[],[{s:1}],[{s:1}],[{s:2}],[{s:2}],[{a:1}],[{s:1,a:1}],[{s:1,a:1}],[{s:1,a:1}],[{s:2,a:1}],[{a:2}],[{t:1}]],
  difficulty:  [[],[{f:1}],[{f:2}],[{th:1}],[{th:1}],[{th:1}],[{th:2}],[{f:1,th:1}]],
  challenge:   [[],[{f:1}],[{f:1}],[{f:2}],[{f:2}],[{th:1}],[{th:1}],[{f:1,th:1}],[{f:1,th:1}],[{f:2,th:1}],[{th:2}],[{d:1}]],
  boost:       [[],[],[{s:1}],[{s:1,a:1}],[{a:2}],[{a:1}]],
  setback:     [[],[],[{f:1}],[{f:1}],[{th:1}],[{th:1}]],
}

function rollDice(pool: Record<string,number>) {
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
// API HELPERS
// ─────────────────────────────────────────────────────────────────────────────
async function api(path: string, method='GET', body?: any) {
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

// Debounce hook — delays saving until the user stops typing
function useDebounce<T>(value: T, delay=900): T {
  const [dv, setDv] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return dv
}

// ─────────────────────────────────────────────────────────────────────────────
// SMALL SHARED UI PIECES
// ─────────────────────────────────────────────────────────────────────────────
function SBtn({ onClick, children, title }: { onClick:()=>void; children:React.ReactNode; title?:string }) {
  return (
    <button
      onClick={onClick} title={title}
      style={{width:20,height:20,borderRadius:'50%',border:'1px solid var(--border)',background:'none',
              color:'var(--text-dim)',fontSize:14,display:'inline-flex',alignItems:'center',
              justifyContent:'center',transition:'all 0.15s'}}
    >{children}</button>
  )
}

function Btn({ onClick, children, variant='default', style={} }:
  { onClick:()=>void; children:React.ReactNode; variant?:string; style?:any }) {
  const v: Record<string,any> = {
    default: {background:'var(--panel)',border:'1px solid var(--border2)',color:'var(--text)'},
    primary: {background:'rgba(212,172,13,0.15)',border:'1px solid rgba(212,172,13,0.5)',color:'var(--gold)'},
    success: {background:'rgba(30,132,73,0.15)',border:'1px solid rgba(30,132,73,0.4)',color:'var(--green-bright)'},
    danger:  {background:'rgba(192,57,43,0.15)',border:'1px solid rgba(192,57,43,0.4)',color:'var(--red)'},
  }
  return (
    <button onClick={onClick}
      style={{padding:'8px 16px',borderRadius:6,fontFamily:'var(--display)',fontSize:12,fontWeight:600,
              letterSpacing:'0.06em',textTransform:'uppercase',...v[variant],...style}}
    >{children}</button>
  )
}

function CardSection({ title, children }: { title:string; children:React.ReactNode }) {
  return (
    <div style={{marginBottom:16}}>
      <div style={{fontFamily:'var(--display)',fontSize:12,fontWeight:700,letterSpacing:'0.12em',
                   textTransform:'uppercase',color:'var(--gold)',marginBottom:10,paddingBottom:6,
                   borderBottom:'1px solid rgba(212,172,13,0.3)'}}>{title}</div>
      {children}
    </div>
  )
}

function GmCard({ title, children, col=1 }: { title:string; children:React.ReactNode; col?:number }) {
  return (
    <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:8,
                 padding:16,gridColumn:`span ${col}`}}>
      <div style={{fontFamily:'var(--display)',fontSize:12,fontWeight:700,letterSpacing:'0.12em',
                   textTransform:'uppercase',color:'var(--gold)',marginBottom:14,paddingBottom:8,
                   borderBottom:'1px solid rgba(212,172,13,0.3)'}}>{title}</div>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GALAXY MAP
// ─────────────────────────────────────────────────────────────────────────────
function GalaxyMap({ showHidden }: { showHidden: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selected, setSelected] = useState<string|null>(null)
  const [hover, setHover]       = useState<string|null>(null)
  const [pan, setPan]           = useState({x:0,y:0})
  const [zoom, setZoom]         = useState(1)
  const dragging = useRef(false)
  const lastMouse = useRef<{x:number,y:number}|null>(null)
  const dragDist  = useRef(0)
  const starsRef  = useRef<any[]|null>(null)

  const isHidden = (loc:any) => (loc.type==='hidden'||loc.type==='command') && !showHidden
  const toScreen = (x:number,y:number) => ({x:x*zoom+pan.x, y:y*zoom+pan.y})
  const toWorld  = (x:number,y:number) => ({x:(x-pan.x)/zoom, y:(y-pan.y)/zoom})

  function draw() {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    ctx.fillStyle = '#050a14'; ctx.fillRect(0,0,W,H)

    // Stars
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

    // Lanes
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
          ctx.save(); ctx.font=`${Math.round(8*Math.min(zoom,1.4))}px Share Tech Mono`
          ctx.fillStyle='rgba(72,100,158,0.8)'; ctx.textAlign='center'
          ctx.fillText(`${dist} ly`,mx,my-4); ctx.restore()
        }
      }
    })

    // Hazard zones
    LOCATIONS.filter(n=>n.type==='hazard').forEach(n => {
      const s=toScreen(n.x,n.y), r=50*zoom
      ctx.save(); ctx.beginPath(); ctx.arc(s.x,s.y,r,0,Math.PI*2)
      ctx.fillStyle='rgba(55,88,170,0.07)'; ctx.strokeStyle='rgba(55,88,170,0.28)'
      ctx.lineWidth=1.5; ctx.setLineDash([4,6]); ctx.fill(); ctx.stroke(); ctx.restore()
    })

    // Location nodes
    LOCATIONS.filter(n=>n.type!=='hazard').forEach(n => {
      const T = TYPE_META[n.type]; if (!T) return
      const hidden = isHidden(n)
      const s = toScreen(n.x,n.y)
      const r = (n.type==='home'?14:n.type==='command'?12:11)*zoom
      if (hidden) {
        ctx.save(); ctx.beginPath(); ctx.arc(s.x,s.y,r*0.7,0,Math.PI*2)
        ctx.strokeStyle='rgba(171,71,188,0.35)'; ctx.lineWidth=1; ctx.setLineDash([3,4]); ctx.stroke()
        if (zoom>0.75) {
          ctx.font=`${Math.round(10*zoom)}px Share Tech Mono`
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
        const fz=Math.max(10,Math.round(11*Math.min(zoom,1.6)))
        ctx.save(); ctx.font=`600 ${fz}px Exo 2`; ctx.textAlign='center'
        ctx.fillStyle=n.type==='home'?'#4fc3f7':n.type==='command'?'#00e5ff':'rgba(188,202,228,0.9)'
        ctx.fillText(n.name,s.x,s.y+r+13)
        if (zoom>0.85&&n.ly) {
          ctx.font=`${Math.max(9,Math.round(9*zoom))}px Share Tech Mono`
          ctx.fillStyle='rgba(110,130,172,0.7)'
          ctx.fillText(`${n.ly} ly`,s.x,s.y+r+24)
        }
        ctx.restore()
      }
    })

    // Hazard labels
    LOCATIONS.filter(n=>n.type==='hazard').forEach(n => {
      if (zoom>0.55) {
        const s=toScreen(n.x,n.y),r=50*zoom
        ctx.save(); ctx.font=`${Math.max(10,Math.round(10*zoom))}px Exo 2`
        ctx.fillStyle='rgba(240,98,146,0.65)'; ctx.textAlign='center'
        ctx.fillText(n.name,s.x,s.y+r+13); ctx.restore()
      }
    })
  }

  useEffect(() => { draw() }, [pan,zoom,selected,hover,showHidden])

  useEffect(() => {
    function resize() {
      const c=canvasRef.current; if(!c) return
      const w=c.parentElement!; c.width=w.clientWidth; c.height=w.clientHeight; draw()
    }
    resize()
    window.addEventListener('resize',resize)
    return () => window.removeEventListener('resize',resize)
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

  const selLoc = LOCATIONS.find(l=>l.id===selected)

  return (
    <div style={{height:'100%',display:'flex'}}>
      {/* Canvas */}
      <div style={{flex:1,position:'relative',overflow:'hidden',
                   background:'radial-gradient(ellipse at 30% 50%, rgba(10,20,40,0.8) 0%, #04060C 70%)'}}>
        <canvas ref={canvasRef}
          style={{cursor:dragging.current?'grabbing':'grab',display:'block',width:'100%',height:'100%'}}
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
        />
      </div>
      {/* Sidebar */}
      <div style={{width:300,flexShrink:0,background:'var(--bg2)',borderLeft:'1px solid var(--border)',
                   display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)',
                     fontFamily:'var(--display)',fontSize:13,fontWeight:700,
                     letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gold)'}}>
          Navigation Data
        </div>
        <div style={{flex:1,overflowY:'auto',padding:12}}>
          <p style={{fontSize:11,color:'var(--text-dim)',fontFamily:'var(--mono)',marginBottom:12,lineHeight:1.6}}>
            Click a node to select. Scroll to zoom. Drag to pan.
          </p>
          {selLoc && (
            <div style={{background:'rgba(212,172,13,0.06)',border:'1px solid rgba(212,172,13,0.4)',
                         borderRadius:6,padding:12,marginBottom:12}}>
              <div style={{fontFamily:'var(--display)',fontSize:14,fontWeight:600,color:'var(--text-bright)',marginBottom:4}}>
                {selLoc.name}
              </div>
              <div style={{fontSize:10,fontFamily:'var(--mono)',letterSpacing:'0.1em',textTransform:'uppercase',
                           color:TYPE_META[selLoc.type]?.color,marginBottom:6}}>
                {TYPE_META[selLoc.type]?.label}
              </div>
              <div style={{fontSize:11,color:'var(--text-dim)',lineHeight:1.5,marginBottom:8}}>{selLoc.desc}</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {selLoc.ly && (
                  <span style={{fontFamily:'var(--mono)',fontSize:10,background:'rgba(255,255,255,0.06)',
                                borderRadius:3,padding:'2px 6px',color:'var(--text-dim)'}}>
                    {selLoc.ly} ly
                  </span>
                )}
                <span style={{fontFamily:'var(--mono)',fontSize:10,background:'rgba(255,100,100,0.08)',
                              borderRadius:3,padding:'2px 6px',color:'rgba(255,120,120,0.8)'}}>
                  {selLoc.threat}
                </span>
              </div>
            </div>
          )}
          <div style={{fontSize:11,color:'var(--text-dim)',fontFamily:'var(--display)',fontWeight:700,
                       letterSpacing:'0.1em',textTransform:'uppercase',marginTop:8,marginBottom:8}}>
            All Locations
          </div>
          {LOCATIONS.filter(l=>l.type!=='hazard'&&(!isHidden(l))).map(loc=>(
            <div key={loc.id}
              onClick={()=>setSelected(loc.id===selected?null:loc.id)}
              style={{background:selected===loc.id?'rgba(212,172,13,0.06)':'var(--panel)',
                      border:`1px solid ${selected===loc.id?'rgba(212,172,13,0.4)':'var(--border)'}`,
                      borderRadius:6,padding:'8px 10px',marginBottom:5,cursor:'pointer',transition:'all 0.2s'}}>
              <div style={{fontFamily:'var(--display)',fontSize:12,fontWeight:600,color:'var(--text-bright)',marginBottom:2}}>
                {loc.name}
              </div>
              <div style={{fontSize:9,fontFamily:'var(--mono)',letterSpacing:'0.1em',textTransform:'uppercase',
                           color:TYPE_META[loc.type]?.color}}>
                {TYPE_META[loc.type]?.label}
                {loc.ly ? `  ·  ${loc.ly} ly` : ''}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CHARACTER SHEET
// ─────────────────────────────────────────────────────────────────────────────
function CharacterSheet({ char, onChange }: { char:any; onChange:(c:any)=>void }) {
  const color = CHAR_COLORS[char.colorIdx] || CHAR_COLORS[0]
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
    color:'var(--text)',fontFamily:'var(--body)',fontSize:12,padding:'2px 0',
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
            <span style={{fontFamily:'var(--display)',fontSize:32,fontWeight:700,color}}>{initials}</span>
          </div>
          <div style={{flex:1}}>
            <input value={char.name||''} onChange={e=>update('name',e.target.value)} placeholder="Character Name"
              style={{fontFamily:'var(--display)',fontSize:24,fontWeight:700,color:'var(--text-bright)',
                      background:'none',border:'none',borderBottom:'1px solid var(--border2)',
                      width:'100%',marginBottom:8,padding:'2px 0',outline:'none'}}/>
            <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
              {[['player','Player'],['species','Species'],['career','Career'],['specialisation','Specialisation']].map(([k,l])=>(
                <div key={k} style={{display:'flex',flexDirection:'column',gap:2}}>
                  <div style={{fontSize:9,fontFamily:'var(--mono)',color:'var(--text-dim)',
                               textTransform:'uppercase',letterSpacing:'0.1em'}}>{l}</div>
                  <input value={char[k]||''} onChange={e=>update(k,e.target.value)} placeholder="—"
                    style={inp({minWidth:90})}/>
                </div>
              ))}
              <div style={{display:'flex',flexDirection:'column',gap:2}}>
                <div style={{fontSize:9,fontFamily:'var(--mono)',color:'var(--text-dim)',
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
              <div style={{fontSize:9,fontFamily:'var(--mono)',color:'var(--text-dim)',textAlign:'right',marginBottom:2}}>XP SPENT</div>
              <div style={{display:'flex',alignItems:'center',gap:4}}>
                <div style={{fontFamily:'var(--display)',fontSize:20,fontWeight:700,color:'var(--gold)'}}>{char.xp||0}</div>
                <SBtn onClick={()=>update('xp',(char.xp||0)+5)}>+</SBtn>
                <SBtn onClick={()=>update('xp',Math.max(0,(char.xp||0)-5))}>−</SBtn>
              </div>
            </div>
            <div>
              <div style={{fontSize:9,fontFamily:'var(--mono)',color:'var(--text-dim)',textAlign:'right',marginBottom:2}}>DUTY</div>
              <div style={{display:'flex',alignItems:'center',gap:4}}>
                <div style={{fontFamily:'var(--display)',fontSize:20,fontWeight:700,color:'var(--gold)'}}>{char.duty||0}</div>
                <SBtn onClick={()=>update('duty',(char.duty||0)+1)}>+</SBtn>
                <SBtn onClick={()=>update('duty',Math.max(0,(char.duty||0)-1))}>−</SBtn>
              </div>
            </div>
          </div>
        </div>

        {/* ── Characteristics ── */}
        <CardSection title="Characteristics">
          <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:8}}>
            {CHAR_KEYS.map(k=>(
              <div key={k} style={{background:'var(--panel)',border:'1px solid var(--border)',
                                   borderRadius:6,padding:'10px 8px',textAlign:'center'}}>
                <div style={{fontSize:9,fontFamily:'var(--mono)',color:'var(--text-dim)',
                             textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>{k}</div>
                <div style={{fontFamily:'var(--display)',fontSize:28,fontWeight:700,
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
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
            {([['Wounds','wounds',derivedWT,'var(--red)'],
               ['Strain','strain',derivedST,'#E67E22']] as [string,string,number,string][]).map(([lbl,field,max,col])=>(
              <div key={field} style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,padding:10}}>
                <div style={{fontSize:9,fontFamily:'var(--mono)',color:'var(--text-dim)',
                             textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>{lbl}</div>
                <div style={{fontFamily:'var(--display)',fontSize:20,fontWeight:700,color:'var(--text-bright)'}}>
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
              <div style={{fontSize:9,fontFamily:'var(--mono)',color:'var(--text-dim)',
                           textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>Soak</div>
              <div style={{fontFamily:'var(--display)',fontSize:20,fontWeight:700,color:'var(--text-bright)'}}>{derivedSoak}</div>
              <div style={{fontSize:10,color:'var(--text-dim)',marginTop:4}}>Brawn + armour</div>
            </div>
            <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,padding:10}}>
              <div style={{fontSize:9,fontFamily:'var(--mono)',color:'var(--text-dim)',
                           textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>Defence</div>
              <div style={{fontFamily:'var(--display)',fontSize:20,fontWeight:700,color:'var(--text-bright)'}}>{char.defense||0}</div>
              <div style={{display:'flex',gap:4,marginTop:6}}>
                <SBtn onClick={()=>update('defense',Math.max(0,(char.defense||0)-1))}>−</SBtn>
                <SBtn onClick={()=>update('defense',(char.defense||0)+1)}>+</SBtn>
              </div>
            </div>
          </div>
        </CardSection>

        {/* ── Skills ── */}
        <CardSection title="Skills">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5}}>
            {Object.entries(char.skills||{}).map(([skill,rank]:any)=>{
              const abbr    = SKILL_CHAR[skill]
              const charKey = Object.keys(CHAR_ABBR).find(k=>CHAR_ABBR[k]===abbr)
              const charVal = charKey ? (char.characteristics?.[charKey]||2) : 2
              const prof    = Math.min(rank,charVal)
              const abil    = Math.max(rank,charVal) - prof
              return (
                <div key={skill} style={{display:'flex',alignItems:'center',gap:8,
                                         padding:'4px 6px',borderRadius:4}}>
                  <div style={{fontSize:10,fontFamily:'var(--mono)',color:'var(--text-dim)',width:26}}>{abbr}</div>
                  <div style={{flex:1,fontSize:12,color:'var(--text)'}}>{skill}</div>
                  <div style={{display:'flex',gap:3}}>
                    {Array.from({length:prof}).map((_,i)=>(
                      <div key={`p${i}`} style={{width:14,height:14,borderRadius:3,background:'#FFD700',
                                                  color:'#332200',display:'flex',alignItems:'center',
                                                  justifyContent:'center',fontSize:9,fontWeight:700}}>Y</div>
                    ))}
                    {Array.from({length:abil}).map((_,i)=>(
                      <div key={`a${i}`} style={{width:14,height:14,borderRadius:3,background:'#4CAF50',
                                                  color:'#002200',display:'flex',alignItems:'center',
                                                  justifyContent:'center',fontSize:9,fontWeight:700}}>G</div>
                    ))}
                    {rank===0&&<div style={{width:14,height:14,borderRadius:3,background:'rgba(255,255,255,0.08)',
                                            color:'var(--text-dim)',display:'flex',alignItems:'center',
                                            justifyContent:'center',fontSize:9}}>—</div>}
                  </div>
                  <div style={{display:'flex',gap:2,alignItems:'center'}}>
                    <SBtn onClick={()=>update(`skills.${skill}`,Math.max(0,rank-1))}>−</SBtn>
                    <span style={{fontFamily:'var(--mono)',fontSize:11,width:14,textAlign:'center',color:'var(--text)'}}>{rank}</span>
                    <SBtn onClick={()=>update(`skills.${skill}`,Math.min(5,rank+1))}>+</SBtn>
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
                <div style={{fontFamily:'var(--display)',fontSize:12,fontWeight:600,color:'var(--text-bright)',marginBottom:2}}>{t.name}</div>
                <div style={{fontSize:11,color:'var(--text-dim)',lineHeight:1.5}}>{t.desc}</div>
              </div>
              <button onClick={()=>update('talents',(char.talents||[]).filter((_:any,j:number)=>j!==i))}
                style={{background:'none',border:'none',color:'var(--text-dim)',fontSize:16,cursor:'pointer'}}>×</button>
            </div>
          ))}
          <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:8}}>
            <input value={newTalent.name} onChange={e=>setNewTalent(t=>({...t,name:e.target.value}))}
              placeholder="Talent name"
              style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,
                      padding:'8px 10px',color:'var(--text)',fontFamily:'var(--body)',fontSize:12,outline:'none'}}/>
            <div style={{display:'flex',gap:8}}>
              <input value={newTalent.desc} onChange={e=>setNewTalent(t=>({...t,desc:e.target.value}))}
                placeholder="Description"
                style={{flex:1,background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,
                        padding:'8px 10px',color:'var(--text)',fontFamily:'var(--body)',fontSize:12,outline:'none'}}/>
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
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr>{['Name','Skill','Dam','Crit','Range','Qualities',''].map(h=>(
                <th key={h} style={{fontFamily:'var(--mono)',fontSize:9,textTransform:'uppercase',
                                    letterSpacing:'0.08em',color:'var(--text-dim)',padding:'5px 7px',
                                    textAlign:'left',borderBottom:'1px solid var(--border)'}}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {(char.weapons||[]).map((w:any,i:number)=>(
                <tr key={i}>
                  {(['name','skill','dam','crit','range','qualities'] as const).map(f=>(
                    <td key={f} style={{padding:'6px 7px',fontSize:12,borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                      <input value={w[f]||''} onChange={e=>{
                        const ws=[...char.weapons]; ws[i]={...ws[i],[f]:e.target.value}; update('weapons',ws)
                      }} style={{background:'none',border:'none',color:'var(--text)',fontFamily:'var(--body)',fontSize:12,outline:'none',width:'100%'}}/>
                    </td>
                  ))}
                  <td>
                    <button onClick={()=>update('weapons',(char.weapons||[]).filter((_:any,j:number)=>j!==i))}
                      style={{background:'none',border:'none',color:'var(--text-dim)',fontSize:16,cursor:'pointer'}}>×</button>
                  </td>
                </tr>
              ))}
              <tr>
                {(['name','skill','dam','crit','range','qualities'] as const).map(f=>(
                  <td key={f} style={{padding:'4px 7px'}}>
                    <input value={(newWeapon as any)[f]||''} onChange={e=>setNewWeapon(w=>({...w,[f]:e.target.value}))}
                      placeholder={f}
                      style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:4,
                              padding:'5px 7px',color:'var(--text)',fontFamily:'var(--body)',fontSize:12,
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
        </CardSection>

        {/* ── Notes ── */}
        <CardSection title="Notes & Backstory">
          <textarea value={char.notes||''} onChange={e=>update('notes',e.target.value)} rows={5}
            style={{width:'100%',background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,
                    padding:10,color:'var(--text)',fontFamily:'var(--body)',fontSize:12,
                    resize:'vertical',outline:'none',lineHeight:1.6}}
            placeholder="Character notes, backstory, contacts..."/>
        </CardSection>

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CHARACTERS VIEW
// ─────────────────────────────────────────────────────────────────────────────
function CharactersView({ isGm, playerCharId }: { isGm: boolean; playerCharId: string | null }) {
  const [chars, setChars]     = useState<any[]>([])
  const [activeId, setActiveId] = useState<string|null>(null)
  const [saving, setSaving]   = useState(false)
  const [loading, setLoading] = useState(true)

  const visibleChars  = isGm ? chars : chars.filter(c=>c.id===playerCharId)
  const activeChar    = chars.find(c=>c.id===activeId)
  const debouncedChar = useDebounce(activeChar, 1000)

  useEffect(() => {
    api('/api/characters').then(d=>{
      setChars(d)
      // Players auto-select their own character
      if (!isGm && playerCharId) setActiveId(playerCharId)
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
      {/* List sidebar */}
      <div style={{width:260,flexShrink:0,background:'var(--bg2)',borderRight:'1px solid var(--border)',
                   display:'flex',flexDirection:'column'}}>
        <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)',
                     display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontFamily:'var(--display)',fontSize:13,fontWeight:700,
                       letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gold)'}}>{isGm ? 'Characters' : 'My Character'}</div>
          {isGm && (
            <button onClick={addChar}
              style={{width:28,height:28,borderRadius:'50%',border:'1px solid var(--border2)',
                      background:'var(--panel)',color:'var(--text-dim)',fontSize:18,cursor:'pointer',
                      display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
          )}
        </div>
        <div style={{flex:1,overflowY:'auto',padding:8}}>
          {loading && <div style={{padding:'20px',textAlign:'center',color:'var(--text-dim)',fontSize:11,fontFamily:'var(--mono)'}}>Loading...</div>}
          {!loading&&visibleChars.length===0 && (
            <div style={{padding:'20px',textAlign:'center',color:'var(--text-dim)',fontSize:11,fontFamily:'var(--mono)'}}>
              {isGm ? <>{`No characters yet.`}<br/>{`Click + to create one.`}</> : 'No character assigned yet.'}
            </div>
          )}
          {visibleChars.map(c=>{
            const col=CHAR_COLORS[c.colorIdx]||CHAR_COLORS[0]
            const ini=(c.name||'??').split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase()||'??'
            return (
              <div key={c.id} onClick={()=>setActiveId(c.id)}
                style={{padding:'9px 10px',borderRadius:6,cursor:'pointer',marginBottom:2,
                        display:'flex',alignItems:'center',gap:10,transition:'all 0.2s',
                        background:activeId===c.id?'rgba(212,172,13,0.08)':'transparent',
                        border:activeId===c.id?'1px solid rgba(212,172,13,0.3)':'1px solid transparent'}}>
                <div style={{width:36,height:36,borderRadius:'50%',display:'flex',alignItems:'center',
                             justifyContent:'center',background:`${col}22`,color:col,
                             fontFamily:'var(--display)',fontSize:16,fontWeight:700,flexShrink:0}}>
                  {ini}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:'var(--display)',fontSize:13,fontWeight:600,color:'var(--text-bright)'}}>{c.name}</div>
                  <div style={{fontSize:10,color:'var(--text-dim)'}}>{c.career}{c.specialisation?` · ${c.specialisation}`:''}</div>
                </div>
                {isGm && (
                  <button onClick={e=>{e.stopPropagation();deleteChar(c.id)}}
                    style={{background:'none',border:'none',color:'var(--text-dim)',fontSize:14,cursor:'pointer'}}>×</button>
                )}
              </div>
            )
          })}
        </div>
        {saving && (
          <div style={{padding:'8px 12px',borderTop:'1px solid var(--border)',
                       fontSize:10,color:'var(--gold)',fontFamily:'var(--mono)',textAlign:'center'}}>
            Saving to database…
          </div>
        )}
      </div>
      {/* Sheet area */}
      {activeChar
        ? <CharacterSheet key={activeChar.id} char={activeChar} onChange={c=>updateChar(activeChar.id,c)}/>
        : (
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',
                       justifyContent:'center',gap:12,color:'var(--text-dim)',background:'var(--bg)'}}>
            <div style={{fontSize:48,opacity:0.3}}>◈</div>
            <div style={{fontFamily:'var(--display)',fontSize:16,letterSpacing:'0.08em'}}>
              {isGm ? 'Select or create a character' : 'No character assigned'}
            </div>
            {isGm && <Btn variant="primary" onClick={addChar}>Create Character</Btn>}
          </div>
        )
      }
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIATIVE TRACKER
// ─────────────────────────────────────────────────────────────────────────────
function InitiativeTracker() {
  const [data, setData]     = useState<any>({round:1,currentIdx:0,slots:[],log:[]})
  const [chars, setChars]   = useState<any[]>([])
  const [form, setForm]     = useState({name:'',type:'player',wt:12,st:12,charId:''})
  const [pool, setPool]     = useState({ability:0,proficiency:0,difficulty:0,challenge:0,boost:0,setback:0})
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadData = () => api('/api/initiative').then(d=>setData(d))

  useEffect(() => {
    Promise.all([api('/api/initiative'),api('/api/characters')])
      .then(([init,ch])=>{setData(init);setChars(ch);setLoading(false)})
      .catch(()=>setLoading(false))
  },[])

  async function act(body: any) { await api('/api/initiative','PUT',body); await loadData() }

  async function addCombatant() {
    if(!form.name.trim()) return
    const linked = chars.find(c=>c.id===form.charId)
    await act({action:'add_slot', slot:{
      id:  crypto.randomUUID(), name: form.name, type: form.type,
      wt:  linked ? linked.characteristics.Brawn + linked.woundThreshold   : Number(form.wt)||12,
      st:  linked ? linked.characteristics.Willpower + linked.strainThreshold : Number(form.st)||12,
      charId: form.charId,
    }})
    setForm({name:'',type:'player',wt:12,st:12,charId:''})
  }

  async function wound(slot:any, field:'wounds'|'strain', delta:number) {
    const max = field==='wounds' ? slot.wt : slot.st
    const val = Math.max(0,Math.min(max,(slot[field]||0)+delta))
    await act({action:'update_slot',id:slot.id,
               wounds: field==='wounds'?val:slot.wounds,
               strain: field==='strain'?val:slot.strain,
               crits: slot.crits, used: slot.used})
  }

  async function addCrit(slot:any) {
    await act({action:'update_slot',id:slot.id,wounds:slot.wounds,strain:slot.strain,
               crits:[...(slot.crits||[]),Math.floor(Math.random()*100)+1],used:slot.used})
  }

  function roll() {
    const r = rollDice(pool); setResult(r)
    const parts:string[]=[]
    if(r.s>0)  parts.push(`${r.s} Success`)
    if(r.f>0)  parts.push(`${r.f} Failure`)
    if(r.a>0)  parts.push(`${r.a} Advantage`)
    if(r.th>0) parts.push(`${r.th} Threat`)
    if(r.t>0)  parts.push(`TRIUMPH`)
    if(r.d>0)  parts.push(`DESPAIR`)
    act({action:'add_log', message:`Roll: ${parts.join(', ')||'No result'}`,
         type: r.t>0?'important':r.d>0?'danger':''})
  }

  const DIE_BTNS = [
    {key:'ability',     label:'Ability',     col:'#4CAF50'},
    {key:'proficiency', label:'Proficiency', col:'#FFD700'},
    {key:'difficulty',  label:'Difficulty',  col:'#9B59B6'},
    {key:'challenge',   label:'Challenge',   col:'var(--red)'},
    {key:'boost',       label:'Boost',       col:'var(--cyan)'},
    {key:'setback',     label:'Setback',     col:'#78909C'},
  ]

  if(loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'var(--text-dim)',fontFamily:'var(--mono)'}}>Loading…</div>

  return (
    <div style={{height:'100%',display:'grid',gridTemplateColumns:'1fr 380px'}}>
      {/* Main combat area */}
      <div style={{padding:20,overflowY:'auto',display:'flex',flexDirection:'column',gap:14}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontFamily:'var(--display)',fontSize:22,fontWeight:700,color:'var(--text-bright)',letterSpacing:'0.06em'}}>
            Initiative Order
          </div>
          <div style={{display:'flex',gap:8}}>
            <Btn onClick={()=>act({action:'reset'})}>Reset</Btn>
            <Btn variant="success" onClick={()=>act({action:'advance'})}>Next Turn ▶</Btn>
          </div>
        </div>

        {/* Round banner */}
        <div style={{display:'flex',alignItems:'center',gap:16,padding:'12px 16px',
                     background:'var(--panel)',border:'1px solid var(--border)',borderRadius:8}}>
          <div>
            <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.1em'}}>Round</div>
            <div style={{fontFamily:'var(--display)',fontSize:36,fontWeight:700,color:'var(--gold)',lineHeight:1}}>{data.round}</div>
          </div>
          <div style={{width:1,background:'var(--border)',alignSelf:'stretch'}}/>
          <div>
            <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.1em'}}>Active</div>
            <div style={{fontFamily:'var(--display)',fontSize:15,fontWeight:600,color:'var(--text-bright)'}}>
              {data.slots[data.currentIdx]?.name||'—'}
            </div>
          </div>
          <div style={{width:1,background:'var(--border)',alignSelf:'stretch'}}/>
          <div>
            <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.1em'}}>Combatants</div>
            <div style={{fontFamily:'var(--display)',fontSize:22,fontWeight:700,color:'var(--text-bright)'}}>{data.slots.length}</div>
          </div>
        </div>

        {data.slots.length===0 && (
          <div style={{textAlign:'center',padding:'40px',color:'var(--text-dim)',fontFamily:'var(--mono)',fontSize:12}}>
            No combatants. Add them from the right panel.
          </div>
        )}

        {data.slots.map((slot:any, idx:number) => {
          const cur = idx===data.currentIdx
          const accent = slot.type==='player'?'var(--gold)':slot.type==='enemy'?'var(--red)':'var(--blue-bright)'
          return (
            <div key={slot.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',
                                       background:cur?`${accent}0D`:'var(--panel)',
                                       border:`1px solid ${cur?accent:'var(--border)'}`,borderRadius:6,
                                       transition:'all 0.2s',opacity:slot.used&&!cur?0.5:1,
                                       boxShadow:cur?`0 0 12px ${accent}1A`:'none',
                                       position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',left:0,top:0,bottom:0,width:3,background:accent}}/>
              <div style={{fontFamily:'var(--mono)',fontSize:16,fontWeight:700,
                           color:cur?accent:'var(--text-dim)',minWidth:26}}>{idx+1}</div>
              <span style={{padding:'2px 7px',borderRadius:3,fontSize:9,fontFamily:'var(--mono)',
                            textTransform:'uppercase',letterSpacing:'0.1em',
                            background:`${accent}33`,color:accent}}>{slot.type.toUpperCase()}</span>
              <div style={{fontFamily:'var(--display)',fontSize:14,fontWeight:600,color:'var(--text-bright)',flex:1}}>{slot.name}</div>
              {/* Wound pips */}
              <div style={{display:'flex',alignItems:'center',gap:3}}>
                <span style={{fontSize:9,fontFamily:'var(--mono)',color:'var(--text-dim)'}}>W</span>
                {Array.from({length:Math.min(slot.wt,15)}).map((_,i)=>(
                  <div key={i} onClick={()=>wound(slot,'wounds',i<(slot.wounds||0)?-1:1)}
                    style={{width:10,height:10,borderRadius:'50%',border:'1px solid rgba(255,255,255,0.2)',cursor:'pointer',
                            background:i<(slot.wounds||0)?'var(--red)':'transparent'}}/>
                ))}
                <span style={{fontSize:9,fontFamily:'var(--mono)',color:'var(--text-dim)',marginLeft:5}}>S</span>
                {Array.from({length:Math.min(slot.st,12)}).map((_,i)=>(
                  <div key={i} onClick={()=>wound(slot,'strain',i<(slot.strain||0)?-1:1)}
                    style={{width:10,height:10,borderRadius:'50%',border:'1px solid rgba(255,255,255,0.2)',cursor:'pointer',
                            background:i<(slot.strain||0)?'#E67E22':'transparent'}}/>
                ))}
              </div>
              {(slot.crits||[]).length>0 && (
                <span style={{padding:'2px 6px',background:'rgba(192,57,43,0.3)',border:'1px solid var(--red)',
                              borderRadius:3,fontSize:9,fontFamily:'var(--mono)',color:'var(--red)'}}>
                  CRIT ×{slot.crits.length}
                </span>
              )}
              <div style={{display:'flex',gap:4}}>
                <button onClick={()=>addCrit(slot)} title="Add Critical"
                  style={{width:27,height:27,borderRadius:4,border:'1px solid var(--border)',
                          background:'rgba(255,255,255,0.04)',color:'var(--text-dim)',cursor:'pointer',
                          display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>⚡</button>
                <button onClick={()=>act({action:'remove_slot',id:slot.id})}
                  style={{width:27,height:27,borderRadius:4,border:'1px solid var(--border)',
                          background:'rgba(255,255,255,0.04)',color:'var(--red)',cursor:'pointer',
                          display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>×</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Right sidebar — tools */}
      <div style={{background:'var(--bg2)',borderLeft:'1px solid var(--border)',
                   display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)',
                     fontFamily:'var(--display)',fontSize:13,fontWeight:700,
                     letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gold)'}}>
          Combat Tools
        </div>
        <div style={{flex:1,overflowY:'auto',padding:12,display:'flex',flexDirection:'column',gap:12}}>

          {/* Add combatant */}
          <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:8,padding:14,display:'flex',flexDirection:'column',gap:10}}>
            <div style={{fontFamily:'var(--display)',fontSize:11,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-dim)'}}>
              Add Combatant
            </div>
            <div style={{display:'flex',gap:4}}>
              {['player','enemy','npc'].map(t=>{
                const col=t==='player'?'var(--gold)':t==='enemy'?'var(--red)':'var(--blue-bright)'
                return (
                  <button key={t} onClick={()=>setForm(f=>({...f,type:t}))}
                    style={{flex:1,padding:7,borderRadius:5,cursor:'pointer',
                            border:`1px solid ${form.type===t?col:'var(--border)'}`,
                            background:form.type===t?`${col}33`:'none',
                            color:form.type===t?col:'var(--text-dim)',
                            fontFamily:'var(--display)',fontSize:11,fontWeight:600,
                            textTransform:'uppercase',letterSpacing:'0.06em'}}>
                    {t}
                  </button>
                )
              })}
            </div>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
              placeholder="Name" onKeyDown={e=>e.key==='Enter'&&addCombatant()}
              style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:5,
                      padding:'7px 10px',color:'var(--text)',fontFamily:'var(--body)',fontSize:12,outline:'none'}}/>
            {form.type==='player' && chars.length>0 && (
              <select value={form.charId}
                onChange={e=>{const c=chars.find((ch:any)=>ch.id===e.target.value);setForm(f=>({...f,charId:e.target.value,name:c?c.name:f.name}))}}
                style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:5,
                        padding:'7px 10px',color:'var(--text)',fontFamily:'var(--body)',fontSize:12,outline:'none',cursor:'pointer'}}>
                <option value="">— Link character sheet (optional) —</option>
                {chars.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            <div style={{display:'flex',gap:8}}>
              {[['Wound Threshold','wt'],['Strain Threshold','st']].map(([lbl,k])=>(
                <div key={k} style={{flex:1}}>
                  <div style={{fontSize:9,fontFamily:'var(--mono)',color:'var(--text-dim)',marginBottom:3}}>{lbl}</div>
                  <input type="number" min={1} max={40} value={(form as any)[k]}
                    onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
                    style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:5,
                            padding:'7px 10px',color:'var(--text)',fontFamily:'var(--body)',fontSize:12,outline:'none'}}/>
                </div>
              ))}
            </div>
            <Btn variant="primary" style={{width:'100%',padding:'9px'}} onClick={addCombatant}>
              Add to Initiative
            </Btn>
          </div>

          {/* Dice roller */}
          <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:8,padding:14}}>
            <div style={{fontFamily:'var(--display)',fontSize:11,fontWeight:700,letterSpacing:'0.1em',
                         textTransform:'uppercase',color:'var(--text-dim)',marginBottom:10}}>Dice Roller</div>
            <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:10}}>
              {DIE_BTNS.map(d=>(
                <button key={d.key} onClick={()=>setPool(p=>({...p,[d.key]:(p as any)[d.key]+1}))}
                  style={{padding:'5px 9px',borderRadius:5,border:`1px solid ${d.col}66`,cursor:'pointer',
                          background:(pool as any)[d.key]>0?`${d.col}22`:'none',color:d.col,
                          fontFamily:'var(--display)',fontSize:11,fontWeight:600}}>
                  {(pool as any)[d.key]>0?`${d.label} ×${(pool as any)[d.key]}`:d.label}
                </button>
              ))}
            </div>
            <div style={{display:'flex',gap:6,marginBottom:10}}>
              <Btn variant="primary" style={{flex:1,padding:8}} onClick={roll}>Roll</Btn>
              <Btn style={{padding:'8px 12px'}} onClick={()=>{setPool({ability:0,proficiency:0,difficulty:0,challenge:0,boost:0,setback:0});setResult(null)}}>Clear</Btn>
            </div>
            <div style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:6,padding:12,minHeight:72}}>
              {!result && <span style={{color:'var(--text-dim)',fontFamily:'var(--mono)',fontSize:11}}>Roll result will appear here</span>}
              {result && (
                <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
                  {result.s>0  && <RV val={`+${result.s}`}  lbl="Success"   col="#4CAF50"/>}
                  {result.f>0  && <RV val={`−${result.f}`}  lbl="Failure"   col="var(--red)"/>}
                  {result.a>0  && <RV val={`+${result.a}`}  lbl="Advantage" col="var(--cyan)"/>}
                  {result.th>0 && <RV val={`−${result.th}`} lbl="Threat"    col="#FF9800"/>}
                  {result.t>0  && <RV val={`★ ${result.t}`} lbl="Triumph"   col="#FFD700"/>}
                  {result.d>0  && <RV val={`✕ ${result.d}`} lbl="Despair"   col="var(--red)"/>}
                  {Object.values(result).every(v=>v===0) && <span style={{color:'var(--text-dim)'}}>No net result</span>}
                </div>
              )}
            </div>
          </div>

          {/* Combat log */}
          <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:8,padding:12}}>
            <div style={{fontFamily:'var(--display)',fontSize:10,fontWeight:700,letterSpacing:'0.1em',
                         textTransform:'uppercase',color:'var(--text-dim)',marginBottom:8}}>Combat Log</div>
            <div style={{display:'flex',flexDirection:'column',gap:3,maxHeight:180,overflowY:'auto'}}>
              {(data.log||[]).map((e:any)=>(
                <div key={e.id} style={{fontSize:10,fontFamily:'var(--mono)',padding:'3px 0',
                                        borderBottom:'1px solid rgba(255,255,255,0.04)',
                                        color:e.type==='important'?'var(--gold)':e.type==='danger'?'var(--red)':'var(--text-dim)'}}>
                  <span style={{opacity:0.5,marginRight:6}}>{String(e.time||'').slice(11,16)}</span>
                  {e.message}
                </div>
              ))}
              {(data.log||[]).length===0 && <div style={{fontSize:10,color:'var(--text-dim)',fontFamily:'var(--mono)'}}>No entries yet.</div>}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function RV({ val, lbl, col }: { val:string; lbl:string; col:string }) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
      <div style={{fontFamily:'var(--display)',fontSize:22,fontWeight:700,color:col}}>{val}</div>
      <div style={{fontSize:9,textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--text-dim)'}}>{lbl}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GM DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function GMDashboard() {
  const [state, setState] = useState<any>(INITIAL_CAMPAIGN)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const debounced = useDebounce(state, 1000)

  useEffect(()=>{
    api('/api/campaign').then(d=>{setState(d);setLoading(false)}).catch(()=>setLoading(false))
  },[])

  useEffect(()=>{
    if(loading) return
    setSaving(true)
    api('/api/campaign','PUT',debounced).finally(()=>setSaving(false))
  },[debounced])

  const upd = (k:string,v:any) => setState((s:any)=>({...s,[k]:v}))

  const doneCount   = Object.values(state.missionStatus||{}).filter(s=>s==='done').length
  const activeCount = Object.values(state.missionStatus||{}).filter(s=>s==='active').length
  const act    = state.session<=6?'I: Ghost Protocol':state.session<=14?'II: The Knife\'s Edge':'III: Silent Storm'
  const fill   = state.session<=6?(state.session/6)*100:state.session<=14?((state.session-6)/8)*100:((state.session-14)/10)*100
  const totalD = SHIP_UPGRADES.filter(u=>(state.shipUpgrades||{})[u.id]).reduce((s,u)=>s+u.cost,0)

  function cycleMission(id:string){
    const order=['pending','active','done']
    const cur=(state.missionStatus||{})[id]||'pending'
    upd('missionStatus',{...state.missionStatus,[id]:order[(order.indexOf(cur)+1)%order.length]})
  }

  if(loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'var(--text-dim)',fontFamily:'var(--mono)'}}>
      Loading campaign data…
    </div>
  )

  return (
    <div style={{height:'100%',overflowY:'auto',padding:20,position:'relative'}}>
      {saving && (
        <div style={{position:'fixed',top:60,right:16,background:'rgba(212,172,13,0.15)',
                     border:'1px solid rgba(212,172,13,0.4)',borderRadius:6,padding:'6px 12px',
                     fontSize:11,color:'var(--gold)',fontFamily:'var(--mono)',zIndex:99}}>
          Saving…
        </div>
      )}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,maxWidth:1200,margin:'0 auto'}}>

        {/* Session progress */}
        <GmCard title="Campaign Progress">
          <div style={{marginBottom:14}}>
            <div style={{fontSize:10,fontFamily:'var(--mono)',color:'var(--text-dim)',marginBottom:4}}>Current Session</div>
            <div style={{display:'flex',alignItems:'baseline',gap:10}}>
              <div style={{fontFamily:'var(--display)',fontSize:48,fontWeight:700,color:'var(--gold)',lineHeight:1}}>{state.session}</div>
              <SBtn onClick={()=>upd('session',Math.max(1,state.session-1))}>−</SBtn>
              <SBtn onClick={()=>upd('session',state.session+1)}>+</SBtn>
            </div>
            <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-dim)',marginTop:2}}>Act {act}</div>
            <div style={{background:'rgba(255,255,255,0.06)',borderRadius:4,height:6,marginTop:8,overflow:'hidden'}}>
              <div style={{height:'100%',borderRadius:4,transition:'width 0.4s',width:`${fill}%`,
                           background:state.session<=6?'var(--blue-bright)':state.session<=14?'var(--purple-bright)':'var(--red)'}}/>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {[['Missions Done',doneCount],['Active',activeCount],['Heat',state.heatLevel],['Renaus',state.renausTrack]].map(([l,v])=>(
              <div key={l as string} style={{background:'var(--bg3)',borderRadius:5,padding:'8px 10px',border:'1px solid var(--border)'}}>
                <div style={{fontSize:9,fontFamily:'var(--mono)',color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:3}}>{l}</div>
                <div style={{fontFamily:'var(--display)',fontSize:20,fontWeight:700,color:'var(--text-bright)'}}>{v}</div>
              </div>
            ))}
          </div>
        </GmCard>

        {/* Heat track */}
        <GmCard title="Heat Track">
          <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:10}}>
            {Array.from({length:10}).map((_,i)=>{
              const on=i<state.heatLevel
              const bg=on?(i>=7?'var(--red)':'#E67E22'):'rgba(255,255,255,0.04)'
              return (
                <div key={i} onClick={()=>upd('heatLevel',state.heatLevel===i+1?i:i+1)}
                  style={{width:26,height:26,borderRadius:4,border:'1px solid var(--border2)',cursor:'pointer',
                          background:bg,display:'flex',alignItems:'center',justifyContent:'center',
                          fontFamily:'var(--mono)',fontSize:10,color:on?'white':'transparent',
                          boxShadow:on?`0 0 6px ${i>=7?'rgba(192,57,43,0.4)':'rgba(230,126,34,0.4)'}`:''}}>{i+1}</div>
              )
            })}
          </div>
          {[['1–2','Cold — Normal operations'],['3–4','Warm — Checkpoints tighten'],
            ['5–6','Hot — Renaus hunting'],['7–8','Burning — ISB active'],['9–10','Inferno — Full manhunt']].map(([r,e])=>(
            <div key={r} style={{display:'flex',gap:8,marginBottom:5,alignItems:'center'}}>
              <span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--red)',minWidth:32}}>{r}</span>
              <span style={{fontSize:11,color:'var(--text-dim)'}}>{e}</span>
            </div>
          ))}
          <div style={{marginTop:12,paddingTop:12,borderTop:'1px solid var(--border)'}}>
            <div style={{fontFamily:'var(--display)',fontSize:11,fontWeight:700,letterSpacing:'0.08em',
                         textTransform:'uppercase',color:'var(--gold)',marginBottom:8}}>Renaus Track</div>
            <div style={{display:'flex',gap:6}}>
              {Array.from({length:5}).map((_,i)=>(
                <div key={i} onClick={()=>upd('renausTrack',state.renausTrack===i+1?i:i+1)}
                  style={{width:34,height:34,borderRadius:4,border:'1px solid var(--border2)',cursor:'pointer',
                          background:i<state.renausTrack?'#FF9800':'rgba(255,255,255,0.04)',
                          display:'flex',alignItems:'center',justifyContent:'center',
                          fontSize:10,fontFamily:'var(--mono)',color:i<state.renausTrack?'white':'transparent',
                          boxShadow:i<state.renausTrack?'0 0 6px rgba(255,152,0,0.4)':''}}>□{i+1}</div>
              ))}
            </div>
            <div style={{fontSize:10,color:'var(--text-dim)',fontFamily:'var(--mono)',marginTop:6,lineHeight:1.6}}>
              □3 = Active hunt  □4 = Profile known  □5 = Full manhunt
            </div>
          </div>
        </GmCard>

        {/* Moral ledger */}
        <GmCard title="Moral Ledger">
          {([['MERCY','mercyCount','var(--green-bright)'],
             ['EXPEDIENCY','expedCount','var(--red)']] as [string,string,string][]).map(([lbl,key,col])=>(
            <div key={key} style={{marginBottom:14}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                <span style={{fontSize:12,color:col,minWidth:90,fontFamily:'var(--display)',fontWeight:600}}>{lbl}</span>
                <span style={{fontFamily:'var(--mono)',fontSize:12,color:col,marginLeft:'auto'}}>{(state as any)[key]}</span>
              </div>
              <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                {Array.from({length:10}).map((_,i)=>(
                  <div key={i} onClick={()=>upd(key,(state as any)[key]===i+1?i:i+1)}
                    style={{width:20,height:20,borderRadius:3,border:'1px solid var(--border2)',cursor:'pointer',
                            background:i<(state as any)[key]?col:'rgba(255,255,255,0.04)',
                            boxShadow:i<(state as any)[key]?`0 0 4px ${col}66`:'',transition:'all 0.15s'}}/>
                ))}
              </div>
            </div>
          ))}
          {(()=>{
            const d=state.mercyCount-state.expedCount
            const txt=d>=3?'Ewoks ally. Verath hesitates.':d<=-3?'No Ewoks. Verath does not hesitate.':'Ewoks cautious. Triumph for Verath hesitation.'
            const col=d>=3?'var(--green-bright)':d<=-3?'var(--red)':'var(--gold)'
            return (
              <div style={{background:'var(--bg3)',border:`1px solid ${col}40`,borderRadius:6,padding:10,marginTop:4}}>
                <div style={{fontSize:9,fontFamily:'var(--mono)',color:'var(--text-dim)',marginBottom:4,
                             textTransform:'uppercase',letterSpacing:'0.08em'}}>Act III Outcome</div>
                <div style={{fontSize:11,color:col,lineHeight:1.5}}>{txt}</div>
              </div>
            )
          })()}
        </GmCard>

        {/* Mission status */}
        <GmCard title="Mission Status" col={2}>
          <div style={{display:'flex',flexDirection:'column',gap:5}}>
            {MISSIONS.map(m=>{
              const status=(state.missionStatus||{})[m.id]||'pending'
              const sc=status==='done'?'var(--green-bright)':status==='active'?'var(--gold)':'rgba(255,255,255,0.15)'
              return (
                <div key={m.id} onClick={()=>cycleMission(m.id)}
                  style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',cursor:'pointer',
                          borderRadius:5,border:'1px solid var(--border)',background:'rgba(255,255,255,0.02)',
                          transition:'all 0.2s'}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:sc,flexShrink:0,
                               boxShadow:status==='active'?`0 0 6px ${sc}`:'',
                               animation:status==='active'?'pulse 2s ease-in-out infinite':''}}/>
                  <span style={{fontSize:10,fontFamily:'var(--mono)',color:'var(--text-dim)',minWidth:30}}>ACT {m.act}</span>
                  <div style={{fontFamily:'var(--display)',fontSize:12,fontWeight:600,color:'var(--text)',flex:1}}>{m.name}</div>
                  <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--gold)'}}>{m.duty} Duty</div>
                  <span style={{fontSize:10,fontFamily:'var(--mono)',color:sc,minWidth:46,textAlign:'right'}}>{status.toUpperCase()}</span>
                </div>
              )
            })}
          </div>
          <div style={{fontSize:10,color:'var(--text-dim)',fontFamily:'var(--mono)',marginTop:8}}>
            Click a mission to cycle: pending → active → done
          </div>
        </GmCard>

        {/* Ship status */}
        <GmCard title="Phantom Tide — Status">
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7,marginBottom:14}}>
            {[['Sil','4'],['Speed','3'],['Handling','-1'],['Defence','1/1'],['Armour','3']].map(([l,v])=>(
              <div key={l} style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:5,padding:8,textAlign:'center'}}>
                <div style={{fontSize:9,fontFamily:'var(--mono)',color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:3}}>{l}</div>
                <div style={{fontFamily:'var(--display)',fontSize:18,fontWeight:700,color:'var(--text-bright)'}}>{v}</div>
              </div>
            ))}
            <div onClick={()=>upd('stealthActive',!state.stealthActive)}
              style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:5,padding:8,textAlign:'center',cursor:'pointer'}}>
              <div style={{fontSize:9,fontFamily:'var(--mono)',color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:3}}>Stealth</div>
              <div style={{fontFamily:'var(--display)',fontSize:13,fontWeight:700,
                           color:state.stealthActive?'var(--cyan)':'var(--red)'}}>
                {state.stealthActive?'ACTIVE':'OFFLINE'}
              </div>
            </div>
          </div>
          {([['HULL TRAUMA','ht',25,'var(--red)'],
             ['SYSTEM STRAIN','sst',20,'#E67E22']] as [string,string,number,string][]).map(([lbl,key,max,col])=>(
            <div key={key} style={{marginBottom:10}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                <span style={{fontSize:10,fontFamily:'var(--mono)',color:'var(--text-dim)'}}>{lbl}  {(state as any)[key]} / {max}</span>
                <div style={{display:'flex',gap:4}}>
                  <SBtn onClick={()=>upd(key,Math.max(0,(state as any)[key]-1))}>−</SBtn>
                  <SBtn onClick={()=>upd(key,Math.min(max,(state as any)[key]+1))}>+</SBtn>
                </div>
              </div>
              <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
                {Array.from({length:max}).map((_,i)=>(
                  <div key={i} onClick={()=>upd(key,i<(state as any)[key]?i:i+1)}
                    style={{width:12,height:12,borderRadius:2,border:'1px solid rgba(255,255,255,0.14)',cursor:'pointer',
                            background:i<(state as any)[key]?col:'transparent',
                            outline:key==='ht'&&i===12?'1px solid var(--gold)':'none',outlineOffset:1,transition:'all 0.1s'}}/>
                ))}
              </div>
            </div>
          ))}
        </GmCard>

        {/* Ship upgrades */}
        <GmCard title={`Ship Upgrades — ${totalD} Duty Spent`} col={2}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:16}}>
            {(['A','B','E','F'] as const).map(branch=>{
              const names: Record<string,string> = {A:'Stealth & Sensors',B:'Combat Systems',E:'Support',F:'Hangar & Fighters'}
              return (
                <div key={branch}>
                  <div style={{fontSize:10,fontFamily:'var(--mono)',color:'var(--text-dim)',textTransform:'uppercase',
                               letterSpacing:'0.08em',marginBottom:8}}>Branch {branch} — {names[branch]}</div>
                  {SHIP_UPGRADES.filter(u=>u.branch===branch).map(u=>(
                    <div key={u.id} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 0'}}>
                      <div onClick={()=>upd('shipUpgrades',{...state.shipUpgrades,[u.id]:!(state.shipUpgrades||{})[u.id]})}
                        style={{width:16,height:16,borderRadius:3,cursor:'pointer',flexShrink:0,
                                border:`1px solid ${(state.shipUpgrades||{})[u.id]?'var(--green-bright)':'var(--border2)'}`,
                                background:(state.shipUpgrades||{})[u.id]?'var(--green-bright)':'none',
                                display:'flex',alignItems:'center',justifyContent:'center',
                                fontSize:11,color:'var(--bg)',transition:'all 0.15s'}}>
                        {(state.shipUpgrades||{})[u.id]?'✓':''}
                      </div>
                      <div style={{fontSize:12,flex:1,color:(state.shipUpgrades||{})[u.id]?'var(--text-bright)':'var(--text-dim)'}}>{u.name}</div>
                      <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--gold)'}}>{u.cost}D</div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </GmCard>

        {/* GM Notes */}
        <GmCard title={`GM Notes — Session ${state.session}`} col={3}>
          <textarea value={state.gmNotes||''} onChange={e=>upd('gmNotes',e.target.value)}
            style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:6,
                    padding:10,color:'var(--text)',fontFamily:'var(--body)',fontSize:12,
                    resize:'vertical',outline:'none',minHeight:120,lineHeight:1.6}}
            placeholder="Session notes, NPC states, ongoing threads, player decisions to remember..."/>
        </GmCard>

        {/* Player Accounts */}
        <GmCard title="Player Accounts" col={3}>
          <PlayerAccountsCard/>
        </GmCard>

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (auth: {username:string,role:string,characterId:string}) => void }) {
  const [mode, setMode]         = useState<'login'|'signup'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

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
        body: JSON.stringify({username, password}),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || (mode==='login' ? 'Login failed' : 'Sign up failed')); setLoading(false); return }
      onLogin(data)
    } catch {
      setError('Network error — check your connection')
      setLoading(false)
    }
  }

  return (
    <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',
                 background:'var(--bg)',flexDirection:'column',gap:0}}>
      <div style={{fontFamily:'var(--display)',fontSize:22,fontWeight:700,color:'var(--gold)',
                   letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:6}}>
        Operation: <span style={{color:'var(--red)'}}>Silent</span> Running
      </div>
      <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-dim)',
                   letterSpacing:'0.12em',marginBottom:32}}>SECURE ACCESS TERMINAL</div>

      {/* Mode toggle */}
      <div style={{display:'flex',marginBottom:0,width:320,background:'var(--bg3)',
                   border:'1px solid var(--border)',borderRadius:'8px 8px 0 0',overflow:'hidden'}}>
        {(['login','signup'] as const).map(m => (
          <button key={m} onClick={()=>switchMode(m)} type="button"
            style={{flex:1,padding:'9px 0',fontFamily:'var(--mono)',fontSize:11,fontWeight:600,
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
          <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-dim)',
                       letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:6}}>Username</div>
          <input value={username} onChange={e=>setUsername(e.target.value)}
            autoFocus autoComplete="username"
            style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:6,
                    padding:'9px 12px',color:'var(--text)',fontFamily:'var(--mono)',fontSize:13,
                    outline:'none',boxSizing:'border-box'}}/>
        </div>
        <div>
          <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-dim)',
                       letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:6}}>Password</div>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
            autoComplete={mode==='login' ? 'current-password' : 'new-password'}
            style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:6,
                    padding:'9px 12px',color:'var(--text)',fontFamily:'var(--mono)',fontSize:13,
                    outline:'none',boxSizing:'border-box'}}/>
        </div>
        {mode === 'signup' && (
          <div>
            <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-dim)',
                         letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:6}}>Confirm Password</div>
            <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)}
              autoComplete="new-password"
              style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:6,
                      padding:'9px 12px',color:'var(--text)',fontFamily:'var(--mono)',fontSize:13,
                      outline:'none',boxSizing:'border-box'}}/>
          </div>
        )}
        {mode === 'signup' && (
          <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-dim)',
                       lineHeight:1.6,padding:'6px 8px',background:'rgba(255,255,255,0.03)',
                       borderRadius:5,border:'1px solid var(--border)'}}>
            New accounts have <span style={{color:'var(--text)'}}>player access</span> — galaxy map &amp; your character only.
            Your GM will link your character after you sign up.
          </div>
        )}
        {error && (
          <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--red)',
                       background:'rgba(192,57,43,0.1)',border:'1px solid rgba(192,57,43,0.3)',
                       borderRadius:5,padding:'7px 10px'}}>{error}</div>
        )}
        <button type="submit" disabled={loading}
          style={{marginTop:4,padding:'10px',borderRadius:6,border:'1px solid rgba(212,172,13,0.5)',
                  background:'rgba(212,172,13,0.12)',color:'var(--gold)',fontFamily:'var(--display)',
                  fontSize:13,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',
                  cursor:loading?'wait':'pointer',opacity:loading?0.6:1}}>
          {loading ? (mode==='login' ? 'Authenticating…' : 'Creating Account…') : (mode==='login' ? 'Sign In' : 'Create Account')}
        </button>
      </form>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAYER ACCOUNTS (GM-only panel inside GMDashboard)
// ─────────────────────────────────────────────────────────────────────────────
function PlayerAccountsCard() {
  const [users, setUsers]   = useState<any[]>([])
  const [chars, setChars]   = useState<any[]>([])
  const [form, setForm]     = useState({username:'',password:'',characterId:''})
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api('/api/auth/users'), api('/api/characters')])
      .then(([u,c]) => { setUsers(u); setChars(c); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function createUser() {
    if (!form.username || !form.password) { setError('Username and password required'); return }
    setError('')
    try {
      await api('/api/auth/users','POST',{...form, role:'player'})
      const u = await api('/api/auth/users')
      setUsers(u)
      setForm({username:'',password:'',characterId:''})
    } catch (e: any) { setError(e.message) }
  }

  async function deleteUser(id: string) {
    await api(`/api/auth/users/${id}`,'DELETE')
    setUsers(u=>u.filter((x:any)=>x.id!==id))
  }

  async function linkChar(userId: string, characterId: string) {
    await api(`/api/auth/users/${userId}`,'PATCH',{characterId})
    setUsers(u=>u.map((x:any)=>x.id===userId?{...x,character_id:characterId}:x))
  }

  if (loading) return <div style={{padding:12,color:'var(--text-dim)',fontFamily:'var(--mono)',fontSize:11}}>Loading…</div>

  return (
    <div>
      {/* Existing users */}
      {users.filter((u:any)=>u.role==='player').length===0 && (
        <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-dim)',marginBottom:12}}>No player accounts yet.</div>
      )}
      {users.filter((u:any)=>u.role==='player').map((u:any) => (
        <div key={u.id} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',
                                borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
          <span style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--text-bright)',flex:'0 0 100px'}}>{u.username}</span>
          <select value={u.character_id||''} onChange={e=>linkChar(u.id,e.target.value)}
            style={{flex:1,background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:4,
                    padding:'4px 6px',color:'var(--text)',fontFamily:'var(--mono)',fontSize:11}}>
            <option value=''>— no character —</option>
            {chars.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={()=>deleteUser(u.id)}
            style={{background:'none',border:'none',color:'var(--red)',fontSize:14,cursor:'pointer',flexShrink:0}}>×</button>
        </div>
      ))}

      {/* Create player */}
      <div style={{marginTop:14,display:'flex',gap:8,flexWrap:'wrap',alignItems:'flex-end'}}>
        <input placeholder="username" value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))}
          style={{flex:'1 1 90px',minWidth:80,background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:4,
                  padding:'6px 8px',color:'var(--text)',fontFamily:'var(--mono)',fontSize:11}}/>
        <input placeholder="password" type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}
          style={{flex:'1 1 90px',minWidth:80,background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:4,
                  padding:'6px 8px',color:'var(--text)',fontFamily:'var(--mono)',fontSize:11}}/>
        <select value={form.characterId} onChange={e=>setForm(f=>({...f,characterId:e.target.value}))}
          style={{flex:'1 1 110px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:4,
                  padding:'6px 8px',color:'var(--text)',fontFamily:'var(--mono)',fontSize:11}}>
          <option value=''>— no character —</option>
          {chars.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={createUser}
          style={{padding:'6px 14px',borderRadius:4,border:'1px solid rgba(212,172,13,0.4)',
                  background:'rgba(212,172,13,0.1)',color:'var(--gold)',fontFamily:'var(--display)',
                  fontSize:11,fontWeight:700,letterSpacing:'0.08em',cursor:'pointer'}}>Add Player</button>
      </div>
      {error && <div style={{marginTop:8,fontFamily:'var(--mono)',fontSize:11,color:'var(--red)'}}>{error}</div>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]               = useState('gm')
  const [showHidden, setShowHidden] = useState(false)
  const [topHeat, setTopHeat]       = useState(0)
  const [topSession, setTopSession] = useState(1)
  const [ready, setReady]           = useState(false)
  const [auth, setAuth]             = useState<{username:string,role:string,characterId:string}|null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  // On mount: init DB tables, then check if already logged in
  useEffect(() => {
    fetch('/api/init', {method:'POST'})
      .then(() => api('/api/auth/me'))
      .then(user => {
        setAuth(user)
        if (user.role === 'player') setTab('galaxy')
        setAuthChecked(true)
      })
      .catch(() => setAuthChecked(true))
  }, [])

  // Fetch campaign data once authenticated
  useEffect(() => {
    if (!auth) return
    api('/api/campaign')
      .then(d => { setTopHeat(d.heatLevel||0); setTopSession(d.session||1); setReady(true) })
      .catch(() => setReady(true))
  }, [auth])

  // Refresh topbar when switching tabs
  useEffect(() => {
    if (!ready) return
    api('/api/campaign').then(d=>{ setTopHeat(d.heatLevel||0); setTopSession(d.session||1) }).catch(()=>{})
  }, [tab, ready])

  async function logout() {
    await fetch('/api/auth/logout', {method:'POST'}).catch(()=>{})
    setAuth(null); setReady(false); setTab('gm')
  }

  const isGm = auth?.role === 'gm'

  const ALL_TABS = [
    {id:'gm',         label:'GM Dashboard', icon:'⚙',  gmOnly:true},
    {id:'galaxy',     label:'Galaxy Map',   icon:'✦',  gmOnly:false},
    {id:'chars',      label: isGm ? 'Characters' : 'My Character', icon:'◈', gmOnly:false},
    {id:'initiative', label:'Initiative',   icon:'⚡', gmOnly:true},
  ]
  const TABS = ALL_TABS.filter(t => isGm || !t.gmOnly)

  // Loading spinner while checking session
  if (!authChecked) return (
    <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',
                 background:'var(--bg)',color:'var(--text-dim)',fontFamily:'var(--mono)',gap:12}}>
      <span style={{animation:'pulse 1s ease-in-out infinite'}}>●</span> Initialising…
    </div>
  )

  if (!auth) return <LoginScreen onLogin={user => { setAuth(user); if (user.role==='player') setTab('galaxy') }}/>

  return (
    <div style={{height:'100vh',display:'flex',flexDirection:'column'}}>
      {/* ── Top Bar ── */}
      <div style={{height:52,flexShrink:0,display:'flex',alignItems:'center',padding:'0 16px',
                   background:'linear-gradient(90deg,#080E1C 0%,#0A1228 50%,#080E1C 100%)',
                   borderBottom:'1px solid rgba(255,255,255,0.14)',position:'relative',zIndex:100}}>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:1,
                     background:'linear-gradient(90deg,transparent,var(--red),var(--gold),var(--red),transparent)'}}/>

        <div style={{fontFamily:'var(--display)',fontSize:18,fontWeight:700,color:'var(--gold)',
                     letterSpacing:'0.12em',textTransform:'uppercase',marginRight:32,whiteSpace:'nowrap'}}>
          Operation: <span style={{color:'var(--red)'}}>Silent</span> Running
        </div>

        <nav style={{display:'flex',gap:2,flex:1}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{padding:'0 16px',height:52,border:'none',background:'none',
                      fontFamily:'var(--display)',fontSize:13,fontWeight:600,
                      letterSpacing:'0.08em',textTransform:'uppercase',cursor:'pointer',
                      color:tab===t.id?'var(--gold)':'var(--text-dim)',transition:'all 0.2s',
                      display:'flex',alignItems:'center',gap:8,
                      borderBottom:tab===t.id?'2px solid var(--gold)':'2px solid transparent'}}>
              <span style={{fontSize:14}}>{t.icon}</span>{t.label}
            </button>
          ))}
        </nav>

        <div style={{display:'flex',alignItems:'center',gap:14,marginLeft:'auto'}}>
          {isGm && tab==='galaxy' && (
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <div onClick={()=>setShowHidden(h=>!h)}
                style={{width:36,height:20,borderRadius:10,cursor:'pointer',transition:'background 0.2s',
                        background:showHidden?'var(--purple)':'rgba(255,255,255,0.1)',
                        border:`1px solid ${showHidden?'var(--purple-bright)':'var(--border)'}`,
                        position:'relative'}}>
                <div style={{width:14,height:14,borderRadius:'50%',background:'white',position:'absolute',
                             top:2,transition:'left 0.2s',left:showHidden?18:2}}/>
              </div>
              <span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-dim)'}}>Show Hidden</span>
            </div>
          )}
          <div style={{display:'flex',alignItems:'center',gap:5,fontFamily:'var(--mono)',fontSize:11,color:'var(--text-dim)'}}>
            <span>HEAT</span>
            {Array.from({length:10}).map((_,i)=>(
              <div key={i} style={{width:8,height:8,borderRadius:1,
                                   background:i<topHeat?(i>=7?'var(--red)':'#E67E22'):'rgba(255,255,255,0.1)',
                                   animation:i<topHeat&&i>=7?'pulse 1s ease-in-out infinite':''}}/>
            ))}
            <span style={{color:topHeat>=7?'#ef5350':topHeat>=4?'#FF9800':'var(--text-dim)'}}>{topHeat}/10</span>
          </div>
          <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-dim)',
                       background:'var(--panel)',border:'1px solid var(--border)',
                       borderRadius:4,padding:'3px 8px'}}>
            Session {topSession}
          </div>
          {/* User badge + logout */}
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-dim)'}}>{auth.username}</span>
            <span style={{fontFamily:'var(--mono)',fontSize:10,borderRadius:3,padding:'2px 6px',
                          background:isGm?'rgba(212,172,13,0.1)':'rgba(74,144,226,0.1)',
                          border:`1px solid ${isGm?'rgba(212,172,13,0.3)':'rgba(74,144,226,0.3)'}`,
                          color:isGm?'var(--gold)':'#4a90e2'}}>{isGm?'GM':'PLAYER'}</span>
            <button onClick={logout}
              style={{padding:'3px 10px',borderRadius:4,border:'1px solid var(--border)',
                      background:'var(--panel)',color:'var(--text-dim)',fontFamily:'var(--display)',
                      fontSize:11,fontWeight:600,letterSpacing:'0.06em',cursor:'pointer'}}>Sign Out</button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{flex:1,overflow:'hidden'}}>
        {!ready && (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',
                       color:'var(--text-dim)',fontFamily:'var(--mono)',gap:12}}>
            <span style={{animation:'pulse 1s ease-in-out infinite'}}>●</span>
            Connecting to database…
          </div>
        )}
        {ready && tab==='gm'         && <div style={{height:'100%',overflowY:'auto'}}><GMDashboard/></div>}
        {ready && tab==='galaxy'     && <GalaxyMap showHidden={isGm && showHidden}/>}
        {ready && tab==='chars'      && <CharactersView isGm={!!isGm} playerCharId={isGm ? null : (auth.characterId||null)}/>}
        {ready && tab==='initiative' && <InitiativeTracker/>}
      </div>
    </div>
  )
}
