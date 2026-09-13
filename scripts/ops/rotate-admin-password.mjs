/**
 * Rotate ADMIN_PASSWORD in .env.local (never prints existing secrets).
 * Usage: node scripts/rotate-admin-password.mjs
 *        node scripts/rotate-admin-password.mjs --session-secret
 */
import { randomBytes } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const envPath = join(root, '.env.local')
const rotateSession = process.argv.includes('--session-secret')

function generatePassword() {
  // URL-safe, no quotes — easy to paste into Vercel.
  return randomBytes(18).toString('base64url')
}

function generateSessionSecret() {
  return randomBytes(32).toString('base64url')
}

function upsertEnvLine(content, key, value) {
  const line = `${key}=${value}`
  const re = new RegExp(`^${key}=.*$`, 'm')
  if (re.test(content)) return content.replace(re, line)
  const trimmed = content.replace(/\n?$/, '\n')
  return `${trimmed}${line}\n`
}

if (!existsSync(envPath)) {
  console.error('Missing .env.local — copy .env.example first.')
  process.exit(1)
}

const newPassword = generatePassword()
const newSession = rotateSession ? generateSessionSecret() : null

let content = readFileSync(envPath, 'utf8')
content = upsertEnvLine(content, 'ADMIN_PASSWORD', newPassword)
if (newSession) {
  content = upsertEnvLine(content, 'ADMIN_SESSION_SECRET', newSession)
}
writeFileSync(envPath, content, 'utf8')

console.log('Updated .env.local')
console.log('')
console.log('ADMIN_PASSWORD=' + newPassword)
if (newSession) {
  console.log('ADMIN_SESSION_SECRET=' + newSession)
  console.log('')
  console.log('(Session secret rotated — old admin cookies are invalid.)')
}
console.log('')
console.log('Copy ADMIN_PASSWORD into Vercel → Project → Settings → Environment Variables')
console.log('(Production and Preview). Redeploy, then sign in at /admin/login.')
