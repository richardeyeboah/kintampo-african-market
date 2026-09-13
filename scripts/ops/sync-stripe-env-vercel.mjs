/**
 * One-time: push Stripe + webhook env from .env.local to Vercel Production.
 * Prereq: npx vercel login && npx vercel link (in repo root)
 *
 *   node --env-file=.env.local scripts/sync-stripe-env-vercel.mjs
 */

import { spawnSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const NAMES = [
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'GEOAPIFY_API_KEY',
]

function loadEnvLocal() {
  const path = resolve(process.cwd(), '.env.local')
  if (!existsSync(path)) {
    console.error('Missing .env.local')
    process.exit(1)
  }
  const text = readFileSync(path, 'utf8')
  const map = new Map()
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!m) continue
    map.set(m[1], m[2].trim())
  }
  return map
}

function addEnv(name, value, environment) {
  if (!value) {
    console.warn(`Skip ${name} (empty)`)
    return false
  }
  const r = spawnSync(
    'npx',
    ['vercel', 'env', 'add', name, environment, '--force'],
    { input: value, encoding: 'utf8', stdio: ['pipe', 'inherit', 'inherit'], shell: true }
  )
  return r.status === 0
}

const env = loadEnvLocal()
let ok = 0
for (const name of NAMES) {
  const value = process.env[name]?.trim() || env.get(name) || ''
  if (addEnv(name, value, 'production')) ok++
}
console.log(`\nDone: ${ok}/${NAMES.length} variables set on Vercel Production.`)
console.log('Redeploy: npx vercel --prod')
