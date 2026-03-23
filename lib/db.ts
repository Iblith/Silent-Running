// lib/db.ts
// Thin wrapper around the Cloudflare D1 REST API.
// All API routes call this — no Cloudflare SDK needed.

const CF_ACCOUNT  = process.env.CF_ACCOUNT_ID!
const CF_API_KEY  = process.env.CF_API_TOKEN!
const DB_ID       = process.env.CF_D1_DATABASE_ID!

export async function d1<T = any>(
  sql: string,
  params: (string | number | null)[] = []
): Promise<T[]> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/d1/database/${DB_ID}/query`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CF_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`D1 HTTP ${res.status}: ${text}`)
  }

  const json = await res.json()
  if (!json.success) {
    throw new Error(`D1 query failed: ${JSON.stringify(json.errors)}`)
  }

  return (json.result?.[0]?.results ?? []) as T[]
}
