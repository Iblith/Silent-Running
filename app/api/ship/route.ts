// app/api/ship/route.ts
// GET  /api/ship  — all authenticated users
// PUT  /api/ship  — all authenticated; players restricted to operational fields only

import { NextRequest, NextResponse } from 'next/server'
import { d1 } from '@/lib/db'
import { getSession, COOKIE_NAME } from '@/lib/auth'

// Fields only the GM can write
const GM_ONLY_FIELDS = [
  'name','model','speed','silhouette','handling',
  'hullTraumaThreshold','systemStrainThreshold','armor',
  'defense','weapons','attachments',
]

async function getUser(req: NextRequest) {
  return getSession(req.cookies.get(COOKIE_NAME)?.value)
}

const DEFAULT_SHIP = {
  name: 'Unknown Vessel', model: '',
  speed: 2, silhouette: 4, handling: -1,
  hullTraumaThreshold: 22, hullTraumaCurrent: 0,
  systemStrainThreshold: 15, systemStrainCurrent: 0,
  armor: 3, currentSpeed: 0,
  defense: { fore: 2, aft: 1, port: 0, starboard: 0 },
  shields: { fore: 0, aft: 0, port: 0, starboard: 0 },
  weapons: [], attachments: [], crew: [], passengers: [], crewPositions: [], cargo: '', notes: '',
  skills: {
    astrogation: 0, computers: 0, cool: 0, mechanics: 0,
    perception: 0, pilotingPlanetary: 0, pilotingSpace: 0,
    vigilance: 0, gunnery: 0,
  },
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const rows = await d1('SELECT data FROM ship WHERE id = ?', ['main'])
    const raw  = rows[0] ? JSON.parse((rows[0] as any).data || '{}') : {}
    return NextResponse.json({ ...DEFAULT_SHIP, ...raw })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const body = await req.json()

    // Fetch current data so we can merge safely
    const rows   = await d1('SELECT data FROM ship WHERE id = ?', ['main'])
    const current = rows[0] ? { ...DEFAULT_SHIP, ...JSON.parse((rows[0] as any).data || '{}') } : { ...DEFAULT_SHIP }

    // Players may only update operational fields
    if (user.role !== 'gm') {
      for (const key of GM_ONLY_FIELDS) delete body[key]
    }

    const merged = { ...current, ...body }
    await d1('UPDATE ship SET data = ? WHERE id = ?', [JSON.stringify(merged), 'main'])
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
