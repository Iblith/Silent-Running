'use client'
// app/(app)/space-combat/page.tsx
// Space Combat tracker — 50×50 grid map with ship tokens, crew assignment,
// hull trauma / system strain tracking, and dogfighting mode.

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react'
import { api } from '@/lib/ui'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export interface SpaceShip {
  id: string
  name: string
  faction: 'player' | 'enemy' | 'neutral'
  makeModel: string
  silhouette: number      // 1-10
  speed: number
  handling: number
  armor: number
  htThreshold: number     // hull trauma threshold
  htCurrent: number
  ssThreshold: number     // system strain threshold
  ssCurrent: number
  defFore: number
  defPort: number
  defStarboard: number
  defAft: number
  hardPoints: number
  encumbrance: number
  crew: string            // free text
  passengers: string
  consumables: string
  hyperdrive: string
  sensorRange: string
  cargoHold: string
  weapons: ShipWeapon[]
  attachments: ShipAttachment[]
  crits: string[]         // crit effect descriptions
  // map position
  col: number             // 0-49
  row: number             // 0-49
  // dogfighting
  dogfightingWith: string[]   // ids of ships in same dogfight cluster
}

interface ShipWeapon {
  id: string
  name: string
  firingArc: string
  damage: string
  range: string
  crit: string
  special: string
}

interface ShipAttachment {
  id: string
  name: string
  hardPointsRequired: number
  baseModifiers: string
  modifications: string
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const GRID = 50
const CELL = 40   // px per cell at zoom 1

const FACTION_COLOR: Record<string, string> = {
  player:  '#D4AC0D',
  enemy:   '#C0392B',
  neutral: '#2E86C1',
}

// Triangle size scales with silhouette
function silhSize(sil: number): number {
  // sil 1 = 14px, sil 10 = 38px
  return 14 + (sil - 1) * (24 / 9)
}

function newShip(overrides: Partial<SpaceShip> = {}): SpaceShip {
  return {
    id: crypto.randomUUID(),
    name: 'New Ship',
    faction: 'neutral',
    makeModel: '',
    silhouette: 3,
    speed: 3,
    handling: 0,
    armor: 0,
    htThreshold: 14,
    htCurrent: 0,
    ssThreshold: 12,
    ssCurrent: 0,
    defFore: 0, defPort: 0, defStarboard: 0, defAft: 0,
    hardPoints: 2,
    encumbrance: 0,
    crew: '', passengers: '', consumables: '', hyperdrive: '',
    sensorRange: '', cargoHold: '',
    weapons: [], attachments: [], crits: [],
    col: Math.floor(Math.random() * 40) + 5,
    row: Math.floor(Math.random() * 40) + 5,
    dogfightingWith: [],
    ...overrides,
  }
}

function newWeapon(): ShipWeapon {
  return { id: crypto.randomUUID(), name: '', firingArc: 'All', damage: '', range: 'Short', crit: '', special: '' }
}
function newAttachment(): ShipAttachment {
  return { id: crypto.randomUUID(), name: '', hardPointsRequired: 1, baseModifiers: '', modifications: '' }
}

// ─────────────────────────────────────────────────────────────────────────────
// SMALL COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function Btn({ onClick, children, variant='default', style={} }: any) {
  const bg  = variant === 'primary' ? 'rgba(212,172,13,0.12)' : variant === 'danger' ? 'rgba(192,57,43,0.12)' : 'var(--panel)'
  const brd = variant === 'primary' ? 'rgba(212,172,13,0.5)'  : variant === 'danger' ? 'rgba(192,57,43,0.5)'  : 'var(--border2)'
  const col = variant === 'primary' ? 'var(--gold)'           : variant === 'danger' ? 'var(--red)'           : 'var(--text-dim)'
  return (
    <button onClick={onClick}
      style={{ padding:'5px 12px', borderRadius:4, border:`1px solid ${brd}`,
               background:bg, color:col, fontFamily:'var(--display)',
               fontSize:14, fontWeight:600, letterSpacing:'0.06em', cursor:'pointer', ...style }}>
      {children}
    </button>
  )
}

function NumSpin({ label, value, onChange, min=0, max=999 }: any) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
      <span style={{ fontSize:13, fontFamily:'var(--mono)', color:'var(--text-dim)', minWidth:0 }}>{label}</span>
      <button onClick={() => onChange(Math.max(min, value - 1))}
        style={{ width:22, height:22, borderRadius:3, border:'1px solid var(--border2)',
                 background:'var(--bg3)', color:'var(--text-dim)', cursor:'pointer', fontSize:14, lineHeight:1 }}>−</button>
      <span style={{ fontFamily:'var(--mono)', fontSize:15, color:'var(--text-bright)', minWidth:22, textAlign:'center' }}>{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))}
        style={{ width:22, height:22, borderRadius:3, border:'1px solid var(--border2)',
                 background:'var(--bg3)', color:'var(--text-dim)', cursor:'pointer', fontSize:14, lineHeight:1 }}>+</button>
    </div>
  )
}

function BarTrack({ label, current, threshold, color, onChange }: any) {
  return (
    <div style={{ marginBottom:6 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
        <span style={{ fontSize:13, fontFamily:'var(--mono)', color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</span>
        <span style={{ fontSize:13, fontFamily:'var(--mono)', color }}>
          {current}/{threshold}
        </span>
      </div>
      <div style={{ height:6, background:'rgba(255,255,255,0.06)', borderRadius:3, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${Math.min(100, (current/Math.max(1,threshold))*100)}%`,
                      background: color, borderRadius:3, transition:'width 0.25s' }}/>
      </div>
      <div style={{ display:'flex', gap:2, marginTop:3, flexWrap:'wrap' }}>
        {Array.from({ length: Math.min(threshold, 20) }).map((_,i) => (
          <div key={i}
            onClick={() => onChange(i < current ? i : i + 1)}
            style={{ width:10, height:10, borderRadius:2, border:'1px solid rgba(255,255,255,0.15)',
                     background: i < current ? color : 'transparent', cursor:'pointer',
                     boxShadow: i < current ? `0 0 4px ${color}80` : '' }}/>
        ))}
        {threshold > 20 && (
          <span style={{ fontSize:12, fontFamily:'var(--mono)', color:'var(--text-dim)', alignSelf:'center' }}>
            +{threshold-20} more
          </span>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SHIP TRIANGLE TOKEN  (SVG)
// ─────────────────────────────────────────────────────────────────────────────
function ShipTriangle({ faction, silhouette, selected, dogfighting }:
  { faction: string; silhouette: number; selected: boolean; dogfighting: boolean }) {
  const col  = FACTION_COLOR[faction] ?? '#78909c'
  const size = silhSize(silhouette)
  const half = size / 2
  // Upward-pointing triangle: peak at top, base at bottom
  const pts  = `0,${size} ${half},0 ${size},${size}`
  return (
    <svg width={size} height={size} style={{ display:'block', overflow:'visible' }}>
      {dogfighting && (
        <circle cx={half} cy={half} r={half + 4}
          fill="none" stroke="#9B59B6" strokeWidth={1.5}
          strokeDasharray="3 2" opacity={0.8}/>
      )}
      <polygon points={pts} fill={`${col}33`}
        stroke={selected ? '#fff' : col}
        strokeWidth={selected ? 2 : 1.5}/>
      {selected && (
        <polygon points={pts} fill="none" stroke="#fff" strokeWidth={3} opacity={0.25}/>
      )}
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DOGFIGHT CIRCLE INDICATOR
// ─────────────────────────────────────────────────────────────────────────────
// Silhouette-1 ships share a square and can enter dogfighting mode.
// We draw a pulsing ring around the cell when ships in it are dogfighting.

// ─────────────────────────────────────────────────────────────────────────────
// GRID MAP
// ─────────────────────────────────────────────────────────────────────────────
interface MapProps {
  ships: SpaceShip[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onMove: (id: string, col: number, row: number) => void
  isGm: boolean
}

function GridMap({ ships, selectedId, onSelect, onMove, isGm }: MapProps) {
  const [zoom, setZoom]             = useState(1)
  const [pan,  setPan]              = useState({ x: 0, y: 0 })
  const [drag, setDrag]             = useState<{ shipId: string; startCol: number; startRow: number } | null>(null)
  const [mapDrag, setMapDrag]       = useState<{ startX: number; startY: number; startPan: { x:number; y:number } } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const cell = CELL * zoom

  function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

  // Zoom with scroll wheel
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    setZoom(z => clamp(z - e.deltaY * 0.001, 0.25, 3))
  }, [])

  // Click on empty grid → deselect
  function onGridClick(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('[data-ship]')) return
    onSelect(null)
  }

  // Pointer events for ship dragging (GM only)
  function onShipPointerDown(e: React.PointerEvent, shipId: string) {
    if (!isGm) { onSelect(shipId); return }
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    const ship = ships.find(s => s.id === shipId)!
    setDrag({ shipId, startCol: ship.col, startRow: ship.row })
    onSelect(shipId)
  }

  function onShipPointerMove(e: React.PointerEvent) {
    if (!drag || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - pan.x
    const y = e.clientY - rect.top  - pan.y
    const col = clamp(Math.floor(x / cell), 0, GRID - 1)
    const row = clamp(Math.floor(y / cell), 0, GRID - 1)
    onMove(drag.shipId, col, row)
  }

  function onShipPointerUp() {
    setDrag(null)
  }

  // Map pan (middle mouse or when no ship is being dragged)
  function onMapPointerDown(e: React.PointerEvent) {
    if (e.button !== 1 && e.button !== 0) return
    if ((e.target as HTMLElement).closest('[data-ship]')) return
    // left-click only pans when Alt is held; middle-click always pans
    if (e.button === 0 && !e.altKey) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setMapDrag({ startX: e.clientX, startY: e.clientY, startPan: { ...pan } })
  }

  function onMapPointerMove(e: React.PointerEvent) {
    if (!mapDrag) return
    setPan({
      x: mapDrag.startPan.x + (e.clientX - mapDrag.startX),
      y: mapDrag.startPan.y + (e.clientY - mapDrag.startY),
    })
  }

  function onMapPointerUp() {
    setMapDrag(null)
  }

  // Group ships by cell for dogfighting logic
  const byCell = useMemo(() => {
    const m: Record<string, SpaceShip[]> = {}
    ships.forEach(s => {
      const key = `${s.col},${s.row}`
      if (!m[key]) m[key] = []
      m[key].push(s)
    })
    return m
  }, [ships])

  const totalSize = GRID * cell

  return (
    <div style={{ flex:1, overflow:'hidden', position:'relative', background:'#04060C' }}>
      {/* Zoom controls */}
      <div style={{ position:'absolute', top:10, right:10, zIndex:10,
                    display:'flex', flexDirection:'column', gap:4 }}>
        <button onClick={() => setZoom(z => clamp(z + 0.15, 0.25, 3))}
          style={{ width:30, height:30, borderRadius:4, border:'1px solid var(--border2)',
                   background:'var(--panel)', color:'var(--text-dim)', fontSize:18, cursor:'pointer' }}>+</button>
        <button onClick={() => setZoom(z => clamp(z - 0.15, 0.25, 3))}
          style={{ width:30, height:30, borderRadius:4, border:'1px solid var(--border2)',
                   background:'var(--panel)', color:'var(--text-dim)', fontSize:18, cursor:'pointer' }}>−</button>
        <button onClick={() => { setZoom(1); setPan({ x:0, y:0 }) }}
          style={{ width:30, height:30, borderRadius:4, border:'1px solid var(--border2)',
                   background:'var(--panel)', color:'var(--text-dim)', fontSize:12, cursor:'pointer',
                   fontFamily:'var(--mono)' }}>⌂</button>
      </div>
      <div style={{ position:'absolute', bottom:8, left:10, zIndex:10,
                    fontFamily:'var(--mono)', fontSize:12, color:'var(--text-dim)',
                    background:'rgba(4,6,12,0.7)', padding:'2px 8px', borderRadius:3 }}>
        Alt+drag to pan • scroll to zoom {isGm ? '• drag tokens to move' : ''}
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        onWheel={onWheel}
        onPointerDown={onMapPointerDown}
        onPointerMove={e => { onMapPointerMove(e); onShipPointerMove(e) }}
        onPointerUp={e => { onMapPointerUp(); onShipPointerUp() }}
        onClick={onGridClick}
        style={{ width:'100%', height:'100%', cursor: mapDrag ? 'grabbing' : 'crosshair', userSelect:'none', overflow:'hidden' }}
      >
        <div style={{ position:'relative', transform:`translate(${pan.x}px,${pan.y}px)`, width: totalSize, height: totalSize }}>

          {/* Grid lines */}
          <svg
            width={totalSize} height={totalSize}
            style={{ position:'absolute', top:0, left:0, pointerEvents:'none' }}
          >
            {/* Major lines every 5 */}
            {Array.from({ length: GRID + 1 }).map((_, i) => (
              <React.Fragment key={i}>
                <line x1={i * cell} y1={0} x2={i * cell} y2={totalSize}
                  stroke={i % 5 === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)'}
                  strokeWidth={i % 5 === 0 ? 0.8 : 0.5}/>
                <line x1={0} y1={i * cell} x2={totalSize} y2={i * cell}
                  stroke={i % 5 === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)'}
                  strokeWidth={i % 5 === 0 ? 0.8 : 0.5}/>
              </React.Fragment>
            ))}
            {/* Dogfighting cell highlights */}
            {Object.entries(byCell).map(([key, cellShips]) => {
              if (cellShips.length < 2) return null
              const hasFighters = cellShips.some(s => s.silhouette === 1)
              if (!hasFighters) return null
              const hasOpposites = cellShips.some(s => s.faction === 'player' || s.faction === 'neutral') &&
                                   cellShips.some(s => s.faction === 'enemy')
              if (!hasOpposites) return null
              const [c, r] = key.split(',').map(Number)
              return (
                <rect key={key} x={c * cell} y={r * cell} width={cell} height={cell}
                  fill="rgba(155,89,182,0.1)" stroke="rgba(155,89,182,0.6)"
                  strokeWidth={1.5} strokeDasharray="4 3">
                  <animate attributeName="stroke-opacity" values="0.6;0.2;0.6" dur="1.5s" repeatCount="indefinite"/>
                </rect>
              )
            })}
          </svg>

          {/* Coordinate labels every 5 */}
          {Array.from({ length: Math.ceil(GRID / 5) }).map((_, i) => {
            const v = i * 5
            return (
              <React.Fragment key={i}>
                <div style={{ position:'absolute', left: v * cell + 2, top:2,
                              fontSize: Math.max(8, 10 * zoom), color:'rgba(255,255,255,0.2)',
                              fontFamily:'var(--mono)', pointerEvents:'none', lineHeight:1 }}>{v}</div>
                <div style={{ position:'absolute', left:2, top: v * cell + 2,
                              fontSize: Math.max(8, 10 * zoom), color:'rgba(255,255,255,0.2)',
                              fontFamily:'var(--mono)', pointerEvents:'none', lineHeight:1 }}>{v}</div>
              </React.Fragment>
            )
          })}

          {/* Ship tokens */}
          {ships.map(ship => {
            const size   = silhSize(ship.silhouette) * zoom
            const cellShips = byCell[`${ship.col},${ship.row}`] ?? []
            const dogfighting = cellShips.length >= 2 &&
              cellShips.some(s => s.faction === 'player' || s.faction === 'neutral') &&
              cellShips.some(s => s.faction === 'enemy') &&
              ship.silhouette === 1

            // Stack sil-1 ships within the same cell
            const stackIdx = cellShips.filter(s => s.silhouette === 1).findIndex(s => s.id === ship.id)
            const stackOffset = ship.silhouette === 1 && stackIdx > 0 ? stackIdx * (size * 0.4) : 0

            const cx = ship.col * cell + cell / 2 - size / 2 + stackOffset
            const cy = ship.row * cell + cell / 2 - size / 2

            return (
              <div
                key={ship.id}
                data-ship={ship.id}
                onPointerDown={e => onShipPointerDown(e, ship.id)}
                style={{
                  position:'absolute',
                  left: cx, top: cy,
                  width: size, height: size,
                  cursor: isGm ? 'grab' : 'pointer',
                  zIndex: ship.id === selectedId ? 20 : 10,
                }}
              >
                <ShipTriangle
                  faction={ship.faction}
                  silhouette={ship.silhouette}
                  selected={ship.id === selectedId}
                  dogfighting={dogfighting}
                />
                {zoom > 0.5 && (
                  <div style={{
                    position:'absolute',
                    top: size + 2,
                    left: '50%',
                    transform:'translateX(-50%)',
                    whiteSpace:'nowrap',
                    fontSize: Math.max(9, 11 * zoom),
                    fontFamily:'var(--display)',
                    fontWeight:600,
                    color: FACTION_COLOR[ship.faction] ?? '#78909c',
                    textShadow:'0 0 4px rgba(0,0,0,0.9)',
                    pointerEvents:'none',
                  }}>
                    {ship.name}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SHIP EDITOR PANEL
// ─────────────────────────────────────────────────────────────────────────────
function ShipEditor({ ship, characters, onChange, onDelete, onClose }:
  { ship: SpaceShip; characters: any[]; onChange: (s: SpaceShip) => void;
    onDelete: () => void; onClose: () => void }) {
  const upd = (k: keyof SpaceShip, v: any) => onChange({ ...ship, [k]: v })
  const [tab, setTab] = useState<'stats'|'weapons'|'crew'|'crits'>('stats')

  const factionColor = FACTION_COLOR[ship.faction] ?? '#78909c'

  function Field({ label, value, onChange: oc, type='text', placeholder='' }: any) {
    return (
      <div style={{ flex:1, minWidth:80 }}>
        <div style={{ fontSize:12, fontFamily:'var(--mono)', color:'var(--text-dim)',
                      textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>{label}</div>
        <input
          type={type} value={value} placeholder={placeholder}
          onChange={e => oc(type==='number' ? Number(e.target.value) : e.target.value)}
          style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border)',
                   borderRadius:4, padding:'5px 8px', color:'var(--text)',
                   fontFamily:'var(--mono)', fontSize:14, outline:'none' }}/>
      </div>
    )
  }

  return (
    <div style={{ width:360, flexShrink:0, background:'var(--bg2)',
                  borderLeft:'1px solid var(--border)', display:'flex',
                  flexDirection:'column', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)',
                    background:`${factionColor}11`,
                    display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <input value={ship.name} onChange={e => upd('name', e.target.value)}
            style={{ width:'100%', background:'transparent', border:'none', outline:'none',
                     fontFamily:'var(--display)', fontSize:17, fontWeight:700,
                     color:'var(--text-bright)', letterSpacing:'0.06em' }}/>
        </div>
        <select value={ship.faction}
          onChange={e => upd('faction', e.target.value as SpaceShip['faction'])}
          style={{ background:'var(--bg3)', border:`1px solid ${factionColor}55`,
                   borderRadius:4, padding:'4px 6px', color: factionColor,
                   fontFamily:'var(--display)', fontSize:13, fontWeight:600,
                   textTransform:'uppercase', cursor:'pointer' }}>
          <option value="player">Player</option>
          <option value="enemy">Enemy</option>
          <option value="neutral">Neutral</option>
        </select>
        <button onClick={onClose}
          style={{ background:'none', border:'none', color:'var(--text-dim)',
                   fontSize:20, cursor:'pointer', lineHeight:1, padding:'0 2px' }}>×</button>
      </div>

      {/* Sub-tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--border)',
                    background:'var(--bg3)', flexShrink:0 }}>
        {(['stats','weapons','crew','crits'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex:1, padding:'8px 4px', border:'none', background:'none',
                     cursor:'pointer', fontFamily:'var(--display)', fontSize:13,
                     fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase',
                     color: tab===t ? 'var(--gold)' : 'var(--text-dim)',
                     borderBottom: tab===t ? '2px solid var(--gold)' : '2px solid transparent' }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:14 }}>

        {/* ── STATS TAB ── */}
        {tab === 'stats' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'flex', gap:8 }}>
              <Field label="Make/Model" value={ship.makeModel} onChange={(v:any)=>upd('makeModel',v)} placeholder="YT-1300"/>
            </div>

            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <Field label="Silhouette" value={ship.silhouette} onChange={(v:any)=>upd('silhouette',Math.max(1,Math.min(10,v)))} type="number"/>
              <Field label="Speed" value={ship.speed} onChange={(v:any)=>upd('speed',v)} type="number"/>
              <Field label="Handling" value={ship.handling} onChange={(v:any)=>upd('handling',v)} type="number"/>
            </div>

            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <Field label="Armor" value={ship.armor} onChange={(v:any)=>upd('armor',v)} type="number"/>
              <Field label="Hard Points" value={ship.hardPoints} onChange={(v:any)=>upd('hardPoints',v)} type="number"/>
              <Field label="Encumbrance" value={ship.encumbrance} onChange={(v:any)=>upd('encumbrance',v)} type="number"/>
            </div>

            {/* Hull Trauma */}
            <div style={{ background:'var(--panel)', border:'1px solid var(--border)',
                          borderRadius:6, padding:10 }}>
              <BarTrack label="Hull Trauma" current={ship.htCurrent} threshold={ship.htThreshold}
                color="#E67E22"
                onChange={(v:number) => upd('htCurrent', Math.max(0, Math.min(ship.htThreshold, v)))}/>
              <div style={{ display:'flex', gap:6, marginTop:4 }}>
                <NumSpin label="Threshold" value={ship.htThreshold}
                  onChange={(v:number) => upd('htThreshold', Math.max(1,v))} min={1}/>
                <NumSpin label="Current" value={ship.htCurrent}
                  onChange={(v:number) => upd('htCurrent', Math.max(0, Math.min(ship.htThreshold, v)))} min={0} max={ship.htThreshold}/>
              </div>
            </div>

            {/* System Strain */}
            <div style={{ background:'var(--panel)', border:'1px solid var(--border)',
                          borderRadius:6, padding:10 }}>
              <BarTrack label="System Strain" current={ship.ssCurrent} threshold={ship.ssThreshold}
                color="#2E86C1"
                onChange={(v:number) => upd('ssCurrent', Math.max(0, Math.min(ship.ssThreshold, v)))}/>
              <div style={{ display:'flex', gap:6, marginTop:4 }}>
                <NumSpin label="Threshold" value={ship.ssThreshold}
                  onChange={(v:number) => upd('ssThreshold', Math.max(1,v))} min={1}/>
                <NumSpin label="Current" value={ship.ssCurrent}
                  onChange={(v:number) => upd('ssCurrent', Math.max(0, Math.min(ship.ssThreshold, v)))} min={0} max={ship.ssThreshold}/>
              </div>
            </div>

            {/* Defense */}
            <div style={{ background:'var(--panel)', border:'1px solid var(--border)',
                          borderRadius:6, padding:10 }}>
              <div style={{ fontSize:13, fontFamily:'var(--mono)', color:'var(--text-dim)',
                            textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Defense</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                {[['Fore','defFore'],['Aft','defAft'],['Port','defPort'],['Starboard','defStarboard']].map(([lbl,k]) => (
                  <Field key={k} label={lbl} value={(ship as any)[k]}
                    onChange={(v:any)=>upd(k as keyof SpaceShip,v)} type="number"/>
                ))}
              </div>
            </div>

            {/* Misc */}
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {[['Crew','crew'],['Passengers','passengers'],['Consumables','consumables'],
                ['Hyperdrive','hyperdrive'],['Sensor Range','sensorRange']].map(([lbl,k])=>(
                <Field key={k} label={lbl} value={(ship as any)[k]} onChange={(v:any)=>upd(k as keyof SpaceShip, v)}/>
              ))}
              <div>
                <div style={{ fontSize:12, fontFamily:'var(--mono)', color:'var(--text-dim)',
                              textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>Cargo Hold</div>
                <textarea value={ship.cargoHold} onChange={e => upd('cargoHold', e.target.value)}
                  rows={2}
                  style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border)',
                           borderRadius:4, padding:'5px 8px', color:'var(--text)',
                           fontFamily:'var(--mono)', fontSize:13, resize:'vertical', outline:'none' }}/>
              </div>
            </div>

            {/* Map position */}
            <div style={{ display:'flex', gap:8 }}>
              <Field label="Col (0–49)" value={ship.col} type="number"
                onChange={(v:number) => upd('col', Math.max(0, Math.min(49, v)))}/>
              <Field label="Row (0–49)" value={ship.row} type="number"
                onChange={(v:number) => upd('row', Math.max(0, Math.min(49, v)))}/>
            </div>

            <Btn variant="danger" onClick={onDelete}>Remove Ship</Btn>
          </div>
        )}

        {/* ── WEAPONS TAB ── */}
        {tab === 'weapons' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {ship.weapons.length === 0 && (
              <div style={{ color:'var(--text-dim)', fontFamily:'var(--mono)', fontSize:14,
                            textAlign:'center', padding:'20px 0' }}>No weapons. Add one below.</div>
            )}
            {ship.weapons.map((w, wi) => {
              const wUpd = (k: keyof ShipWeapon, v: any) => {
                const ws = [...ship.weapons]
                ws[wi] = { ...ws[wi], [k]: v }
                upd('weapons', ws)
              }
              return (
                <div key={w.id} style={{ background:'var(--panel)', border:'1px solid var(--border)',
                                          borderRadius:6, padding:10 }}>
                  <div style={{ display:'flex', gap:6, marginBottom:6 }}>
                    <input value={w.name} onChange={e => wUpd('name', e.target.value)}
                      placeholder="Weapon name"
                      style={{ flex:1, background:'var(--bg3)', border:'1px solid var(--border)',
                               borderRadius:4, padding:'4px 7px', color:'var(--text-bright)',
                               fontFamily:'var(--display)', fontSize:14, fontWeight:600, outline:'none' }}/>
                    <button onClick={() => upd('weapons', ship.weapons.filter((_,i)=>i!==wi))}
                      style={{ background:'none', border:'none', color:'var(--red)', fontSize:18,
                               cursor:'pointer', lineHeight:1 }}>×</button>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
                    {[['Firing Arc','firingArc'],['Damage','damage'],
                      ['Range','range'],['Crit','crit'],['Special','special']].map(([lbl,k]) => (
                      <div key={k} style={{ gridColumn: k==='special' ? '1/-1' : undefined }}>
                        <div style={{ fontSize:11, fontFamily:'var(--mono)', color:'var(--text-dim)',
                                      textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:2 }}>{lbl}</div>
                        <input value={(w as any)[k]} onChange={e => wUpd(k as keyof ShipWeapon, e.target.value)}
                          style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border)',
                                   borderRadius:4, padding:'4px 6px', color:'var(--text)',
                                   fontFamily:'var(--mono)', fontSize:13, outline:'none' }}/>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            <Btn variant="primary" onClick={() => upd('weapons', [...ship.weapons, newWeapon()])}>+ Add Weapon</Btn>

            <div style={{ marginTop:10, borderTop:'1px solid var(--border)', paddingTop:10 }}>
              <div style={{ fontSize:13, fontFamily:'var(--display)', fontWeight:700,
                            color:'var(--text-dim)', textTransform:'uppercase',
                            letterSpacing:'0.1em', marginBottom:8 }}>Attachments</div>
              {ship.attachments.map((a, ai) => {
                const aUpd = (k: keyof ShipAttachment, v: any) => {
                  const as2 = [...ship.attachments]
                  as2[ai] = { ...as2[ai], [k]: v }
                  upd('attachments', as2)
                }
                return (
                  <div key={a.id} style={{ background:'var(--panel)', border:'1px solid var(--border)',
                                            borderRadius:6, padding:10, marginBottom:8 }}>
                    <div style={{ display:'flex', gap:6, marginBottom:6 }}>
                      <input value={a.name} onChange={e => aUpd('name', e.target.value)}
                        placeholder="Attachment name"
                        style={{ flex:1, background:'var(--bg3)', border:'1px solid var(--border)',
                                 borderRadius:4, padding:'4px 7px', color:'var(--text-bright)',
                                 fontFamily:'var(--display)', fontSize:14, fontWeight:600, outline:'none' }}/>
                      <button onClick={() => upd('attachments', ship.attachments.filter((_,i)=>i!==ai))}
                        style={{ background:'none', border:'none', color:'var(--red)', fontSize:18,
                                 cursor:'pointer', lineHeight:1 }}>×</button>
                    </div>
                    {[['Hard Points Required','hardPointsRequired','number'],
                      ['Base Modifiers','baseModifiers','text'],
                      ['Modifications','modifications','text']].map(([lbl,k,ty])=>(
                      <div key={k} style={{ marginBottom:5 }}>
                        <div style={{ fontSize:11, fontFamily:'var(--mono)', color:'var(--text-dim)',
                                      textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:2 }}>{lbl}</div>
                        <input value={(a as any)[k]} type={ty}
                          onChange={e => aUpd(k as keyof ShipAttachment, ty==='number' ? Number(e.target.value) : e.target.value)}
                          style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border)',
                                   borderRadius:4, padding:'4px 6px', color:'var(--text)',
                                   fontFamily:'var(--mono)', fontSize:13, outline:'none' }}/>
                      </div>
                    ))}
                  </div>
                )
              })}
              <Btn variant="primary" onClick={() => upd('attachments', [...ship.attachments, newAttachment()])}>+ Add Attachment</Btn>
            </div>
          </div>
        )}

        {/* ── CREW TAB ── */}
        {tab === 'crew' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ fontSize:13, fontFamily:'var(--mono)', color:'var(--text-dim)',
                          lineHeight:1.5, marginBottom:4 }}>
              Assign characters to crew positions on this ship.
              Character stats (Brawn, Agility, etc.) are read-only here.
            </div>

            {/* Linked character crew cards */}
            <CrewAssignment ship={ship} characters={characters} onChange={onChange}/>
          </div>
        )}

        {/* ── CRITS TAB ── */}
        {tab === 'crits' && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ fontSize:13, fontFamily:'var(--mono)', color:'var(--text-dim)', marginBottom:4 }}>
              Track critical hits on this ship.
            </div>
            {ship.crits.length === 0 && (
              <div style={{ color:'var(--text-dim)', fontFamily:'var(--mono)', fontSize:14,
                            textAlign:'center', padding:'16px 0' }}>No critical hits.</div>
            )}
            {ship.crits.map((c, ci) => (
              <div key={ci} style={{ display:'flex', alignItems:'center', gap:8,
                                      background:'rgba(192,57,43,0.08)',
                                      border:'1px solid rgba(192,57,43,0.3)',
                                      borderRadius:5, padding:'8px 10px' }}>
                <span style={{ flex:1, fontFamily:'var(--mono)', fontSize:14, color:'var(--text)' }}>{c}</span>
                <button onClick={() => upd('crits', ship.crits.filter((_,i)=>i!==ci))}
                  style={{ background:'none', border:'none', color:'var(--red)', fontSize:18,
                           cursor:'pointer', lineHeight:1 }}>×</button>
              </div>
            ))}
            <CritAdder onAdd={(text:string) => upd('crits', [...ship.crits, text])}/>

            <div style={{ marginTop:10, borderTop:'1px solid var(--border)', paddingTop:10 }}>
              <div style={{ fontSize:13, fontFamily:'var(--display)', fontWeight:700,
                            color:'var(--text-dim)', textTransform:'uppercase',
                            letterSpacing:'0.1em', marginBottom:6 }}>Critical Hit Table (Vehicle)</div>
              {VEHICLE_CRITS.map((row, i) => (
                <div key={i} style={{ display:'flex', gap:8, padding:'4px 0',
                                       borderBottom:'1px solid rgba(255,255,255,0.04)',
                                       alignItems:'baseline' }}>
                  <span style={{ fontFamily:'var(--mono)', fontSize:12, color:'var(--text-dim)',
                                 minWidth:46, flexShrink:0 }}>{row.range}</span>
                  <span style={{ fontFamily:'var(--display)', fontWeight:600, fontSize:13,
                                 color: row.sev>=4?'#922B21':row.sev>=3?'var(--red)':row.sev>=2?'#D35400':'#E67E22',
                                 minWidth:120, flexShrink:0 }}>{row.name}</span>
                  <span style={{ fontFamily:'var(--mono)', fontSize:12, color:'var(--text-dim)', flex:1 }}>{row.eff}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CREW ASSIGNMENT
// ─────────────────────────────────────────────────────────────────────────────
const CREW_ROLES = ['Pilot','Co-Pilot','Gunner','Engineer','Sensor Operator','Commander','Passenger']

interface CrewSlot {
  role: string
  characterId: string
}

function CrewAssignment({ ship, characters, onChange }:
  { ship: SpaceShip; characters: any[]; onChange: (s: SpaceShip) => void }) {
  // We store crewSlots as JSON string in ship.crew for simplicity
  let slots: CrewSlot[] = []
  try { slots = JSON.parse(ship.crew) } catch {}
  if (!Array.isArray(slots)) slots = []

  function setSlots(next: CrewSlot[]) {
    onChange({ ...ship, crew: JSON.stringify(next) })
  }

  function addSlot() {
    setSlots([...slots, { role: 'Pilot', characterId: '' }])
  }

  function updateSlot(i: number, k: keyof CrewSlot, v: string) {
    const next = [...slots]
    next[i] = { ...next[i], [k]: v }
    setSlots(next)
  }

  function removeSlot(i: number) {
    setSlots(slots.filter((_,si) => si !== i))
  }

  function charStats(charId: string) {
    const c = characters.find(ch => ch.id === charId)
    if (!c) return null
    return c
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {slots.length === 0 && (
        <div style={{ color:'var(--text-dim)', fontFamily:'var(--mono)', fontSize:14,
                      textAlign:'center', padding:'16px 0' }}>No crew assigned.</div>
      )}
      {slots.map((slot, i) => {
        const ch = charStats(slot.characterId)
        return (
          <div key={i} style={{ background:'var(--panel)', border:'1px solid var(--border)',
                                 borderRadius:6, padding:10 }}>
            <div style={{ display:'flex', gap:6, marginBottom:ch?8:0 }}>
              <select value={slot.role} onChange={e => updateSlot(i, 'role', e.target.value)}
                style={{ background:'var(--bg3)', border:'1px solid var(--border)',
                         borderRadius:4, padding:'4px 6px', color:'var(--gold)',
                         fontFamily:'var(--display)', fontSize:13, fontWeight:600,
                         flex:'0 0 auto', cursor:'pointer' }}>
                {CREW_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={slot.characterId} onChange={e => updateSlot(i, 'characterId', e.target.value)}
                style={{ flex:1, background:'var(--bg3)', border:'1px solid var(--border)',
                         borderRadius:4, padding:'4px 6px', color:'var(--text)',
                         fontFamily:'var(--mono)', fontSize:13, cursor:'pointer' }}>
                <option value="">— NPC / unnamed —</option>
                {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button onClick={() => removeSlot(i)}
                style={{ background:'none', border:'none', color:'var(--red)',
                         fontSize:18, cursor:'pointer', lineHeight:1 }}>×</button>
            </div>
            {ch && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:4 }}>
                {[['Brawn','Brawn'],['Agility','Agility'],['Intellect','Intellect'],
                  ['Cunning','Cunning'],['Willpower','Willpower'],['Presence','Presence']].map(([lbl,key]) => (
                  <div key={key} style={{ background:'var(--bg3)', borderRadius:4,
                                           padding:'4px 6px', textAlign:'center' }}>
                    <div style={{ fontSize:10, fontFamily:'var(--mono)', color:'var(--text-dim)',
                                  textTransform:'uppercase', letterSpacing:'0.08em' }}>{lbl.slice(0,3)}</div>
                    <div style={{ fontSize:16, fontFamily:'var(--display)', fontWeight:700,
                                  color:'var(--text-bright)' }}>
                      {ch.characteristics?.[key] ?? '—'}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {ch && (
              <div style={{ display:'flex', gap:6, marginTop:6 }}>
                <div style={{ flex:1, background:'rgba(192,57,43,0.1)', border:'1px solid rgba(192,57,43,0.3)',
                               borderRadius:4, padding:'4px 8px', textAlign:'center' }}>
                  <div style={{ fontSize:10, fontFamily:'var(--mono)', color:'var(--text-dim)' }}>WOUNDS</div>
                  <div style={{ fontFamily:'var(--mono)', fontSize:14, color:'#E67E22' }}>
                    {ch.wounds ?? 0}/{ch.woundThreshold ?? 12}
                  </div>
                </div>
                <div style={{ flex:1, background:'rgba(46,134,193,0.1)', border:'1px solid rgba(46,134,193,0.3)',
                               borderRadius:4, padding:'4px 8px', textAlign:'center' }}>
                  <div style={{ fontSize:10, fontFamily:'var(--mono)', color:'var(--text-dim)' }}>STRAIN</div>
                  <div style={{ fontFamily:'var(--mono)', fontSize:14, color:'#2E86C1' }}>
                    {ch.strain ?? 0}/{ch.strainThreshold ?? 12}
                  </div>
                </div>
                {ch.skills?.Piloting_Space !== undefined && (
                  <div style={{ flex:1, background:'rgba(212,172,13,0.1)', border:'1px solid rgba(212,172,13,0.3)',
                                 borderRadius:4, padding:'4px 8px', textAlign:'center' }}>
                    <div style={{ fontSize:10, fontFamily:'var(--mono)', color:'var(--text-dim)' }}>PILOT SKL</div>
                    <div style={{ fontFamily:'var(--mono)', fontSize:14, color:'var(--gold)' }}>
                      {ch.skills?.Piloting_Space ?? 0}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
      <Btn variant="primary" onClick={addSlot}>+ Assign Crew</Btn>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CRIT ADDER
// ─────────────────────────────────────────────────────────────────────────────
function CritAdder({ onAdd }: { onAdd: (text: string) => void }) {
  const [val, setVal] = useState('')
  return (
    <div style={{ display:'flex', gap:6 }}>
      <input value={val} onChange={e => setVal(e.target.value)}
        placeholder="Critical hit description or roll result…"
        onKeyDown={e => { if (e.key==='Enter' && val.trim()) { onAdd(val.trim()); setVal('') } }}
        style={{ flex:1, background:'var(--bg3)', border:'1px solid var(--border)',
                 borderRadius:4, padding:'6px 8px', color:'var(--text)',
                 fontFamily:'var(--mono)', fontSize:13, outline:'none' }}/>
      <Btn variant="danger" onClick={() => { if (val.trim()) { onAdd(val.trim()); setVal('') } }}>Add Crit</Btn>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// VEHICLE CRITICAL HIT TABLE (EotE core)
// ─────────────────────────────────────────────────────────────────────────────
const VEHICLE_CRITS = [
  { range:'01–10', sev:1, name:'Gyroscopic Motivator',    eff:'Until repaired, ship loses a maneuver each turn.' },
  { range:'11–20', sev:1, name:'Sensor Damage',           eff:'All ranged attack rolls suffer +1 Difficulty until repaired.' },
  { range:'21–30', sev:1, name:'Loose Cargo',             eff:'A random piece of equipment is damaged or lost.' },
  { range:'31–40', sev:2, name:'Weapons Malfunction',     eff:'One weapon of the attacker\'s choice is inoperable until repaired.' },
  { range:'41–50', sev:2, name:'Structural Damage',       eff:'+1 to Difficulty of all Piloting checks until repaired.' },
  { range:'51–60', sev:2, name:'System Shock',            eff:'Pilot must succeed on Average Piloting to keep control.' },
  { range:'61–70', sev:3, name:'Fuel Leak',               eff:'Ship loses 1 System Strain each round until repaired.' },
  { range:'71–80', sev:3, name:'Hull Breach',             eff:'Compartment begins depressurizing; Difficult Resilience checks or take wounds.' },
  { range:'81–90', sev:3, name:'Drive Damaged',           eff:'Ship speed reduced by 2 (min 0) until repaired.' },
  { range:'91–00', sev:4, name:'Catastrophic Damage',     eff:'Ship is completely incapacitated and begins breaking apart.' },
]

// ─────────────────────────────────────────────────────────────────────────────
// SHIP LIST PANEL (left sidebar)
// ─────────────────────────────────────────────────────────────────────────────
function ShipListPanel({ ships, selectedId, onSelect, onAdd, isGm }:
  { ships: SpaceShip[]; selectedId: string|null; onSelect: (id: string) => void;
    onAdd: () => void; isGm: boolean }) {
  return (
    <div style={{ width:220, flexShrink:0, background:'var(--bg2)',
                  borderRight:'1px solid var(--border)', display:'flex',
                  flexDirection:'column', overflow:'hidden' }}>
      <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)',
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    flexShrink:0 }}>
        <span style={{ fontFamily:'var(--display)', fontSize:14, fontWeight:700,
                       textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--gold)' }}>
          Ships
        </span>
        {isGm && (
          <button onClick={onAdd}
            style={{ padding:'3px 10px', borderRadius:4, border:'1px solid rgba(212,172,13,0.4)',
                     background:'rgba(212,172,13,0.1)', color:'var(--gold)',
                     fontFamily:'var(--display)', fontSize:13, fontWeight:700, cursor:'pointer' }}>
            + Add
          </button>
        )}
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:8 }}>
        {ships.length === 0 && (
          <div style={{ fontFamily:'var(--mono)', fontSize:13, color:'var(--text-dim)',
                        padding:'12px 4px', textAlign:'center' }}>
            {isGm ? 'No ships. Click + Add.' : 'No ships in combat.'}
          </div>
        )}
        {ships.map(ship => {
          const col = FACTION_COLOR[ship.faction] ?? '#78909c'
          const htPct = ship.htThreshold > 0 ? ship.htCurrent / ship.htThreshold : 0
          const ssPct = ship.ssThreshold > 0 ? ship.ssCurrent / ship.ssThreshold : 0
          const sel = ship.id === selectedId
          return (
            <div key={ship.id} onClick={() => onSelect(ship.id)}
              style={{ padding:'8px 10px', borderRadius:6, marginBottom:4, cursor:'pointer',
                       border:`1px solid ${sel ? col : 'var(--border)'}`,
                       background: sel ? `${col}11` : 'var(--panel)',
                       transition:'all 0.15s' }}>
              {/* Triangle indicator + name */}
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                <svg width={12} height={12}>
                  <polygon points={`0,12 6,0 12,12`} fill={`${col}33`} stroke={col} strokeWidth={1.5}/>
                </svg>
                <span style={{ fontFamily:'var(--display)', fontSize:14, fontWeight:600,
                               color: sel ? 'var(--text-bright)' : 'var(--text)',
                               flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {ship.name}
                </span>
                <span style={{ fontSize:11, fontFamily:'var(--mono)', color: col,
                               background:`${col}22`, padding:'1px 4px', borderRadius:2 }}>
                  Sil {ship.silhouette}
                </span>
              </div>
              {/* Mini bars */}
              <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ fontSize:10, fontFamily:'var(--mono)', color:'var(--text-dim)', minWidth:16 }}>HT</span>
                  <div style={{ flex:1, height:4, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${Math.min(100,htPct*100)}%`,
                                  background: htPct >= 1 ? 'var(--red)' : htPct >= 0.6 ? '#E67E22' : '#27AE60',
                                  borderRadius:2 }}/>
                  </div>
                  <span style={{ fontSize:10, fontFamily:'var(--mono)', color:'var(--text-dim)', minWidth:24 }}>
                    {ship.htCurrent}/{ship.htThreshold}
                  </span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ fontSize:10, fontFamily:'var(--mono)', color:'var(--text-dim)', minWidth:16 }}>SS</span>
                  <div style={{ flex:1, height:4, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${Math.min(100,ssPct*100)}%`,
                                  background: ssPct >= 1 ? 'var(--red)' : ssPct >= 0.6 ? '#2E86C1' : '#27AE60',
                                  borderRadius:2 }}/>
                  </div>
                  <span style={{ fontSize:10, fontFamily:'var(--mono)', color:'var(--text-dim)', minWidth:24 }}>
                    {ship.ssCurrent}/{ship.ssThreshold}
                  </span>
                </div>
              </div>
              {ship.crits.length > 0 && (
                <div style={{ marginTop:3, display:'inline-block', padding:'1px 5px',
                              background:'rgba(192,57,43,0.2)', border:'1px solid rgba(192,57,43,0.4)',
                              borderRadius:3, fontSize:11, fontFamily:'var(--mono)', color:'var(--red)' }}>
                  CRIT ×{ship.crits.length}
                </div>
              )}
              <div style={{ fontSize:11, fontFamily:'var(--mono)', color:'var(--text-dim)', marginTop:3 }}>
                {ship.col},{ship.row}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ padding:'8px 12px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
        <div style={{ fontSize:11, fontFamily:'var(--mono)', color:'var(--text-dim)',
                      textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Legend</div>
        {Object.entries(FACTION_COLOR).map(([f,c]) => (
          <div key={f} style={{ display:'flex', alignItems:'center', gap:5, marginBottom:3 }}>
            <svg width={10} height={10}>
              <polygon points="0,10 5,0 10,10" fill={`${c}33`} stroke={c} strokeWidth={1.5}/>
            </svg>
            <span style={{ fontSize:11, fontFamily:'var(--mono)', color: c,
                           textTransform:'capitalize' }}>{f}</span>
          </div>
        ))}
        <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:3 }}>
          <svg width={14} height={14}>
            <circle cx={7} cy={7} r={5} fill="none" stroke="#9B59B6"
              strokeWidth={1.5} strokeDasharray="3 2"/>
          </svg>
          <span style={{ fontSize:11, fontFamily:'var(--mono)', color:'#9B59B6' }}>Dogfighting</span>
        </div>
        <div style={{ marginTop:4, fontSize:10, fontFamily:'var(--mono)', color:'var(--text-dim)', lineHeight:1.4 }}>
          Sil 1 ships sharing a cell with an opposite faction enter dogfighting mode.
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function SpaceCombatPage() {
  const [ships,      setShips]      = useState<SpaceShip[]>([])
  const [characters, setCharacters] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [isGm,       setIsGm]       = useState(false)

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load data
  useEffect(() => {
    Promise.all([
      api('/api/space-combat').catch(() => ({})),
      api('/api/characters?all=1').catch(() => []),
      api('/api/auth/me').catch(() => null),
    ]).then(([sc, chars, me]) => {
      setShips((sc as any).ships ?? [])
      setCharacters(chars)
      setIsGm(me?.role === 'gm')
      setLoading(false)
    })
  }, [])

  // Auto-save with debounce
  function saveShips(next: SpaceShip[]) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaving(true)
    saveTimer.current = setTimeout(() => {
      api('/api/space-combat', 'PUT', { ships: next })
        .finally(() => setSaving(false))
    }, 800)
  }

  function updateShips(next: SpaceShip[]) {
    setShips(next)
    saveShips(next)
  }

  function addShip() {
    const ship = newShip()
    updateShips([...ships, ship])
    setSelectedId(ship.id)
  }

  function updateShip(updated: SpaceShip) {
    updateShips(ships.map(s => s.id === updated.id ? updated : s))
  }

  function deleteShip(id: string) {
    setSelectedId(null)
    updateShips(ships.filter(s => s.id !== id))
  }

  function moveShip(id: string, col: number, row: number) {
    if (!isGm) return
    updateShips(ships.map(s => s.id === id ? { ...s, col, row } : s))
  }

  const selectedShip = ships.find(s => s.id === selectedId) ?? null

  if (loading) {
    return (
      <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center',
                    color:'var(--text-dim)', fontFamily:'var(--mono)', gap:10 }}>
        <span style={{ animation:'pulse 1s ease-in-out infinite' }}>●</span> Loading space combat…
      </div>
    )
  }

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column' }}>

      {/* Sub-header */}
      <div style={{ flexShrink:0, height:38, display:'flex', alignItems:'center',
                    padding:'0 14px', background:'var(--bg2)',
                    borderBottom:'1px solid var(--border)',
                    justifyContent:'space-between' }}>
        <span style={{ fontFamily:'var(--display)', fontSize:15, fontWeight:700,
                       textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--gold)' }}>
          ◈ Space Combat
        </span>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {/* Quick damage buttons for selected ship */}
          {selectedShip && isGm && (
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontFamily:'var(--mono)', fontSize:13, color:'var(--text-dim)' }}>
                {selectedShip.name}:
              </span>
              <button onClick={() => updateShip({ ...selectedShip, htCurrent: Math.min(selectedShip.htThreshold, selectedShip.htCurrent + 1) })}
                style={{ padding:'2px 8px', borderRadius:3, border:'1px solid rgba(230,126,34,0.5)',
                         background:'rgba(230,126,34,0.1)', color:'#E67E22',
                         fontFamily:'var(--mono)', fontSize:12, cursor:'pointer' }}>HT+</button>
              <button onClick={() => updateShip({ ...selectedShip, htCurrent: Math.max(0, selectedShip.htCurrent - 1) })}
                style={{ padding:'2px 8px', borderRadius:3, border:'1px solid rgba(230,126,34,0.3)',
                         background:'transparent', color:'var(--text-dim)',
                         fontFamily:'var(--mono)', fontSize:12, cursor:'pointer' }}>HT−</button>
              <button onClick={() => updateShip({ ...selectedShip, ssCurrent: Math.min(selectedShip.ssThreshold, selectedShip.ssCurrent + 1) })}
                style={{ padding:'2px 8px', borderRadius:3, border:'1px solid rgba(46,134,193,0.5)',
                         background:'rgba(46,134,193,0.1)', color:'#2E86C1',
                         fontFamily:'var(--mono)', fontSize:12, cursor:'pointer' }}>SS+</button>
              <button onClick={() => updateShip({ ...selectedShip, ssCurrent: Math.max(0, selectedShip.ssCurrent - 1) })}
                style={{ padding:'2px 8px', borderRadius:3, border:'1px solid rgba(46,134,193,0.3)',
                         background:'transparent', color:'var(--text-dim)',
                         fontFamily:'var(--mono)', fontSize:12, cursor:'pointer' }}>SS−</button>
            </div>
          )}
          {saving && (
            <span style={{ fontFamily:'var(--mono)', fontSize:12, color:'var(--text-dim)',
                           animation:'pulse 1s ease-in-out infinite' }}>Saving…</span>
          )}
        </div>
      </div>

      {/* Body: list | map | editor */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        <ShipListPanel
          ships={ships}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAdd={addShip}
          isGm={isGm}
        />

        <GridMap
          ships={ships}
          selectedId={selectedId}
          onSelect={id => setSelectedId(id)}
          onMove={moveShip}
          isGm={isGm}
        />

        {selectedShip && (
          <ShipEditor
            ship={selectedShip}
            characters={characters}
            onChange={updated => {
              if (isGm || selectedShip.faction === 'player') updateShip(updated)
            }}
            onDelete={() => { if (isGm) deleteShip(selectedShip.id) }}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </div>
  )
}
