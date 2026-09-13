/**
 * Update Supabase recovery email template to use TokenHash + /auth/confirm
 * so email scanners don't burn one-time ConfirmationURL links.
 *
 *   $env:SUPABASE_ACCESS_TOKEN='sbp_...'; node scripts/configure-recovery-email-template.mjs
 */
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
      if (!process.env[key]) process.env[key] = val
    }
  } catch {
    /* ignore */
  }
}

loadEnvFile('.env.local')

const token = process.env.SUPABASE_ACCESS_TOKEN?.trim()
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
if (!token || !supabaseUrl) {
  console.error('Need SUPABASE_ACCESS_TOKEN + NEXT_PUBLIC_SUPABASE_URL')
  process.exit(1)
}

const ref = supabaseUrl.match(/^https:\/\/([^.]+)\.supabase\.co/)?.[1]
if (!ref) {
  console.error('Bad Supabase URL')
  process.exit(1)
}

const recoveryHtml = `<h2>Reset your password</h2>
<p>We received a request to reset your Kintampo African Market password.</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">Continue to reset password</a></p>
<p>If you did not request this, you can ignore this email.</p>
<p>This link works once. Open it on your phone or computer and tap Continue.</p>`

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
}

const patch = {
  mailer_subjects_recovery: 'Reset your Kintampo password',
  mailer_templates_recovery_content: recoveryHtml,
  // Give people longer before the OTP expires (seconds)
  mailer_otp_exp: 3600,
}

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify(patch),
})
const body = await res.json().catch(() => ({}))
if (!res.ok) {
  console.error('Failed', res.status, body)
  process.exit(1)
}

console.log('Recovery email template updated to TokenHash + /auth/confirm')
console.log('mailer_otp_exp:', body.mailer_otp_exp)
console.log('Done.')
