import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const email = process.argv[2] || 'kalebdoffour@gmail.com'

if (!url || !service || !anon) {
  console.error('missing env')
  process.exit(1)
}

const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } })
const pub = createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } })

console.log('Generating recovery link for', email)
const { data, error } = await admin.auth.admin.generateLink({
  type: 'recovery',
  email,
  options: {
    redirectTo: 'https://kintampoafricanmarket.com/auth/confirm?next=/reset-password',
  },
})
if (error) {
  console.error('generateLink error', error)
  process.exit(1)
}

console.log('action_link:', data.properties?.action_link)
console.log('hashed_token present:', Boolean(data.properties?.hashed_token))
console.log('email_otp present:', Boolean(data.properties?.email_otp))
console.log('redirect_to:', data.properties?.redirect_to)

// Try verify with hashed token the same way the confirm page does
const tokenHash = data.properties?.hashed_token
if (tokenHash) {
  const { data: v, error: ve } = await pub.auth.verifyOtp({
    type: 'recovery',
    token_hash: tokenHash,
  })
  console.log('verifyOtp with hashed_token:', ve ? `FAIL ${ve.message}` : `OK user=${v.user?.email}`)
}

// Also trigger a real email send
const { error: sendErr } = await pub.auth.resetPasswordForEmail(email, {
  redirectTo: 'https://kintampoafricanmarket.com/auth/confirm?next=/reset-password',
})
console.log('resetPasswordForEmail:', sendErr ? `FAIL ${sendErr.message}` : 'OK (email queued)')
