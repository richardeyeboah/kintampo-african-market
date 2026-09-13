import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

function loadEnv(path) {
  try {
    for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
      const line = raw.trim()
      if (!line || line.startsWith('#')) continue
      const i = line.indexOf('=')
      if (i < 0) continue
      let k = line.slice(0, i)
      let v = line.slice(i + 1)
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
      if (v && !process.env[k]) process.env[k] = v
    }
  } catch {}
}
loadEnv('.env.local')

const token = process.env.SUPABASE_ACCESS_TOKEN?.trim()
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
const ref = url.match(/^https:\/\/([^.]+)\.supabase\.co/)[1]
const gmailUser = 'kalebdoffour@gmail.com'
const gmailPass = (process.env.GMAIL_APP_PASSWORD || 'ffsujjuccjfqmmuz').replace(/\s+/g, '')
const email = (process.argv[2] || 'kkras5050@gmail.com').trim()

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
}

const patch = {
  site_url: 'https://kintampoafricanmarket.com',
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
<p>Open the link, then tap Continue.</p>`,
  mailer_otp_exp: 3600,
  // Keep rate limit reasonable for testing
  smtp_max_frequency: 30,
}

console.log('Re-applying SMTP…')
const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify(patch),
})
const body = await res.json().catch(() => ({}))
if (!res.ok) {
  console.error('PATCH failed', res.status, body)
  process.exit(1)
}
console.log('smtp_host', body.smtp_host, 'smtp_user', body.smtp_user, 'port', body.smtp_port)

// Wait a moment for config to propagate
await new Promise((r) => setTimeout(r, 2000))

const pub = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
console.log('Sending recovery to', email)
const { data, error } = await pub.auth.resetPasswordForEmail(email, {
  redirectTo: 'https://kintampoafricanmarket.com/auth/confirm?next=/reset-password',
})
console.log(error ? `FAIL: ${error.message} | status=${error.status} | code=${error.code}` : 'OK sent', data)
