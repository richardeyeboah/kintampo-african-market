import { readFileSync } from 'node:fs'

function loadEnvFile(path) {
  try {
    const text = readFileSync(path, 'utf8')
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim()
      if (!line || line.startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq < 0) continue
      const key = line.slice(0, eq).trim()
      let val = line.slice(eq + 1).trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      if (!val || val.includes('SENSITIVE')) continue
      if (!process.env[key]) process.env[key] = val
    }
  } catch {
    /* ignore */
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env.vercel.production')

const token = process.env.SUPABASE_ACCESS_TOKEN?.trim()
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const gmailUser = process.env.GMAIL_USER?.trim()
const gmailPass = process.env.GMAIL_APP_PASSWORD?.trim()

if (!token) {
  console.error('Missing SUPABASE_ACCESS_TOKEN')
  process.exit(1)
}
if (!supabaseUrl || supabaseUrl.includes('SENSITIVE')) {
  console.error('Missing real NEXT_PUBLIC_SUPABASE_URL')
  process.exit(1)
}

const refMatch = supabaseUrl.match(/^https:\/\/([^.]+)\.supabase\.co/)
if (!refMatch) {
  console.error('Could not parse project ref from URL')
  process.exit(1)
}
const ref = refMatch[1]
const SITE = 'https://kintampoafricanmarket.com'

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
}

const getRes = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
  headers,
})
const current = await getRes.json().catch(() => ({}))
if (!getRes.ok) {
  console.error('GET auth config failed', getRes.status, current)
  process.exit(1)
}

console.log('Project ref:', ref)
console.log('Current site_url:', current.site_url)
console.log('Current uri_allow_list:', current.uri_allow_list)
console.log('Current mailer_autoconfirm:', current.mailer_autoconfirm)
console.log('Gmail user present:', Boolean(gmailUser && !gmailUser.includes('SENSITIVE')))
console.log('Gmail pass present:', Boolean(gmailPass && !gmailPass.includes('SENSITIVE')))

const redirectList = [
  `${SITE}/auth/callback`,
  `${SITE}/**`,
  'http://localhost:3000/auth/callback',
  'http://localhost:3000/**',
]

const patch = {
  site_url: SITE,
  uri_allow_list: redirectList.join(','),
  mailer_autoconfirm: true,
  external_email_enabled: true,
}

if (gmailUser && gmailPass && !gmailUser.includes('SENSITIVE')) {
  Object.assign(patch, {
    smtp_admin_email: gmailUser,
    smtp_host: 'smtp.gmail.com',
    smtp_port: '587',
    smtp_user: gmailUser,
    smtp_pass: gmailPass,
    smtp_sender_name: 'Kintampo African Market',
    mailer_subjects_recovery: 'Reset your Kintampo password',
    mailer_templates_recovery_content: `<h2>Reset your password</h2>
<p>We received a request to reset your Kintampo African Market password.</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">Continue to reset password</a></p>
<p>If you did not request this, you can ignore this email.</p>
<p>Open the link, then tap Continue. This stops email scanners from using the link first.</p>`,
    mailer_otp_exp: 3600,
  })
  console.log('SMTP: configuring Gmail + safe recovery email template')
} else {
  console.log('SMTP: skipped')
}

const patchRes = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify(patch),
})
const updated = await patchRes.json().catch(() => ({}))
if (!patchRes.ok) {
  console.error('PATCH auth config failed', patchRes.status, updated)
  process.exit(1)
}

console.log('\nUpdated:')
console.log('  site_url:', updated.site_url)
console.log('  uri_allow_list:', updated.uri_allow_list)
console.log('  mailer_autoconfirm:', updated.mailer_autoconfirm)
console.log('  smtp_host:', updated.smtp_host || '(none)')
console.log('  smtp_user:', updated.smtp_user ? 'set' : '(none)')
console.log('\nDone.')
