/**
 * Apply a SQL file to Supabase Postgres (DDL/migrations).
 * Requires SUPABASE_DB_PASSWORD in env (Dashboard → Settings → Database).
 *
 *   node --env-file=.env.local scripts/apply-sql-file.mjs supabase/ensure-checkout-snapshots.sql
 */

import { readFileSync } from 'fs'
import pg from 'pg'

const file = process.argv[2]
if (!file) {
  console.error('Usage: node scripts/apply-sql-file.mjs <path-to.sql>')
  process.exit(1)
}

const password = process.env.SUPABASE_DB_PASSWORD?.trim()
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const ref = url?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

if (!password || !ref) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_DB_PASSWORD in env.')
  process.exit(1)
}

const sql = readFileSync(file, 'utf8')
const client = new pg.Client({
  host: `db.${ref}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password,
  ssl: { rejectUnauthorized: false },
})

await client.connect()
try {
  await client.query(sql)
  console.log('Applied:', file)
} finally {
  await client.end()
}
