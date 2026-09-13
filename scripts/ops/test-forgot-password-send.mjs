import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

function loadEnvFile(path) {
  try {
    for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
      const line = raw.trim()
      if (!line || line.startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq < 0) continue
      const key = line.slice(0, eq).trim()
      let val = line.slice(eq + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (val && !process.env[key]) process.env[key] = val
    }
  } catch {}
}
loadEnvFile('.env.local')

const email = (process.argv[2] || '').trim().toLowerCase()
if (!email) {
  console.error('Usage: node scripts/test-forgot-password-send.mjs you@email.com')
  process.exit(1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
const gmailUser = process.env.GMAIL_USER?.trim()
const gmailPass = process.env.GMAIL_APP_PASSWORD?.trim().replace(/\s+/g, '')
// Always use production in emailed links (local SITE_URL is often localhost).
const origin = 'https://kintampoafricanmarket.com'

if (!url || !service) {
  console.error('missing supabase env')
  process.exit(1)
}
if (!gmailUser || !gmailPass) {
  console.error('missing GMAIL_USER / GMAIL_APP_PASSWORD')
  process.exit(1)
}

const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } })

console.log('generateLink for', email)
const { data, error } = await admin.auth.admin.generateLink({
  type: 'recovery',
  email,
  options: { redirectTo: `${origin}/auth/confirm?next=/account` },
})
if (error) {
  console.error('generateLink FAIL:', error.message)
  process.exit(1)
}

const tokenHash = data.properties?.hashed_token
if (!tokenHash) {
  console.error('no hashed_token')
  process.exit(1)
}

const confirmUrl = new URL(`${origin}/auth/confirm`)
confirmUrl.searchParams.set('token_hash', tokenHash)
confirmUrl.searchParams.set('type', 'recovery')
confirmUrl.searchParams.set('next', '/account')
const link = confirmUrl.toString()
console.log('confirm url host+path:', confirmUrl.origin + confirmUrl.pathname)
console.log('token_hash length:', tokenHash.length)

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: gmailUser, pass: gmailPass },
})

const info = await transporter.sendMail({
  from: `Kintampo African Market <${gmailUser}>`,
  to: email,
  subject: 'Reset your password — Kintampo African Market (test)',
  text: `Open: ${link}`,
  html: `<p><a href="${link}">Continue</a></p><p>${link}</p>`,
})
console.log('sent OK messageId=', info.messageId)
