// app/api/init/route.ts
// Run once after deploy: POST /api/init
// Creates all tables and seeds initial rows in D1.
// Safe to run multiple times — uses CREATE TABLE IF NOT EXISTS.

import { NextResponse } from 'next/server'

const CF      = process.env.CF_ACCOUNT_ID!
const KEY     = process.env.CF_API_TOKEN!
const DB_ID   = process.env.CF_D1_DATABASE_ID!
const BASE    = `https://api.cloudflare.com/client/v4/accounts/${CF}/d1/database/${DB_ID}/query`

async function run(sql: string) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql, params: [] }),
    cache: 'no-store',
  })
  const json = await res.json()
  if (!json.success) console.error('SQL error:', json.errors, '\nSQL:', sql)
  return json
}

export async function GET() {
  return NextResponse.json({ message: 'POST to this endpoint to initialise the database schema.' })
}

export async function POST() {
  try {
    await run(`CREATE TABLE IF NOT EXISTS campaign_state (
      id             TEXT PRIMARY KEY DEFAULT 'main',
      session        INTEGER DEFAULT 1,
      heat_level     INTEGER DEFAULT 0,
      renaus_track   INTEGER DEFAULT 0,
      mercy_count    INTEGER DEFAULT 0,
      exped_count    INTEGER DEFAULT 0,
      ht             INTEGER DEFAULT 0,
      sst            INTEGER DEFAULT 0,
      stealth_active INTEGER DEFAULT 0,
      mission_status TEXT DEFAULT '{}',
      ship_upgrades  TEXT DEFAULT '{}',
      gm_notes       TEXT DEFAULT '',
      updated_at     TEXT DEFAULT (datetime('now'))
    )`)

    await run(`CREATE TABLE IF NOT EXISTS characters (
      id               TEXT PRIMARY KEY,
      name             TEXT NOT NULL DEFAULT 'New Character',
      player           TEXT DEFAULT '',
      species          TEXT DEFAULT '',
      career           TEXT DEFAULT '',
      specialisation   TEXT DEFAULT '',
      color_idx        INTEGER DEFAULT 0,
      characteristics  TEXT DEFAULT '{}',
      wounds           INTEGER DEFAULT 0,
      wound_threshold  INTEGER DEFAULT 12,
      strain           INTEGER DEFAULT 0,
      strain_threshold INTEGER DEFAULT 12,
      soak             INTEGER DEFAULT 2,
      defense          INTEGER DEFAULT 0,
      force_rating     INTEGER DEFAULT 0,
      duty             INTEGER DEFAULT 0,
      duty_type        TEXT DEFAULT '',
      morality         INTEGER DEFAULT 50,
      skills           TEXT DEFAULT '{}',
      talents          TEXT DEFAULT '[]',
      weapons          TEXT DEFAULT '[]',
      equipment        TEXT DEFAULT '[]',
      notes            TEXT DEFAULT '',
      xp               INTEGER DEFAULT 0,
      total_xp         INTEGER DEFAULT 0,
      updated_at       TEXT DEFAULT (datetime('now'))
    )`)

    await run(`CREATE TABLE IF NOT EXISTS initiative_slots (
      id         TEXT PRIMARY KEY,
      session    INTEGER DEFAULT 1,
      name       TEXT NOT NULL,
      type       TEXT DEFAULT 'player',
      wt         INTEGER DEFAULT 12,
      st         INTEGER DEFAULT 12,
      wounds     INTEGER DEFAULT 0,
      strain     INTEGER DEFAULT 0,
      crits      TEXT DEFAULT '[]',
      used       INTEGER DEFAULT 0,
      char_id    TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0
    )`)

    await run(`CREATE TABLE IF NOT EXISTS initiative_state (
      id          TEXT PRIMARY KEY DEFAULT 'main',
      round       INTEGER DEFAULT 1,
      current_idx INTEGER DEFAULT 0
    )`)

    await run(`CREATE TABLE IF NOT EXISTS combat_log (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      session    INTEGER DEFAULT 1,
      message    TEXT NOT NULL,
      type       TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )`)

    await run(`INSERT OR IGNORE INTO campaign_state (id) VALUES ('main')`)
    await run(`INSERT OR IGNORE INTO initiative_state (id) VALUES ('main')`)

    return NextResponse.json({ ok: true, message: 'Database schema initialised successfully.' })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
