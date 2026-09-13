import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import net from 'node:net'
import tls from 'node:tls'

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
const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
const ref = url?.match(/^https:\/\/([^.]+)\.supabase\.co/)?.[1]
const email = (process.argv[2] || 'kkras5050@gmail.com').trim().toLowerCase()
const gmailUser = process.env.GMAIL_USER?.trim() || 'kalebdoffour@gmail.com'
const gmailPass = (process.env.GMAIL_APP_PASSWORD || 'ffsujjuccjfqmmuz').replace(/\s+/g, '')

async function peekAuth() {
  if (!token || !ref) return null
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}

async function testGmailSmtp() {
  // Minimal SMTP AUTH check against Gmail
  return new Promise((resolve) => {
    const socket = net.connect(587, 'smtp.gmail.com')
    let buf = ''
    let step = 0
    const send = (line) => socket.write(line + '\r\n')
    const timer = setTimeout(() => {
      socket.destroy()
      resolve({ ok: false, detail: 'timeout' })
    }, 15000)
    socket.on('data', (d) => {
      buf += d.toString()
      if (step === 0 && buf.includes('220')) {
        step = 1
        buf = ''
        send('EHLO kintampo.test')
      } else if (step === 1 && buf.includes('250 ') && buf.includes('STARTTLS')) {
        step = 2
        buf = ''
        send('STARTTLS')
      } else if (step === 2 && buf.includes('220')) {
        step = 3
        buf = ''
        const secure = tls.connect(
          { socket, servername: 'smtp.gmail.com' },
          () => {
            secure.write('EHLO kintampo.test\r\n')
          }
        )
        let sbuf = ''
        let sstep = 0
        secure.on('data', (sd) => {
          sbuf += sd.toString()
          if (sstep === 0 && sbuf.includes('250 ')) {
            sstep = 1
            sbuf = ''
            secure.write('AUTH LOGIN\r\n')
          } else if (sstep === 1 && sbuf.includes('334')) {
            sstep = 2
            sbuf = ''
            secure.write(Buffer.from(gmailUser).toString('base64') + '\r\n')
          } else if (sstep === 2 && sbuf.includes('334')) {
            sstep = 3
            sbuf = ''
            secure.write(Buffer.from(gmailPass).toString('base64') + '\r\n')
          } else if (sstep === 3) {
            clearTimeout(timer)
            const ok = sbuf.includes('235')
            secure.end()
            socket.end()
            resolve({ ok, detail: ok ? 'Gmail AUTH OK' : sbuf.trim().slice(0, 180) })
          }
        })
      }
    })
    socket.on('error', (e) => {
      clearTimeout(timer)
      resolve({ ok: false, detail: e.message })
    })
  })
}

const cfg = await peekAuth()
console.log('=== AUTH SMTP CONFIG ===')
console.log(
  JSON.stringify(
    {
      smtp_host: cfg?.smtp_host,
      smtp_port: cfg?.smtp_port,
      smtp_user: cfg?.smtp_user,
      smtp_admin_email: cfg?.smtp_admin_email,
      mailer_autoconfirm: cfg?.mailer_autoconfirm,
      recovery_uses_token_hash: String(cfg?.mailer_templates_recovery_content || '').includes('TokenHash'),
      mailer_otp_exp: cfg?.mailer_otp_exp,
    },
    null,
    2
  )
)

console.log('\n=== GMAIL SMTP LOGIN TEST ===')
const smtp = await testGmailSmtp()
console.log(smtp)

const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })
const pub = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })

console.log('\n=== USERS ===')
const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 50 })
const match = (users?.users || []).find((u) => u.email?.toLowerCase() === email)
console.log(
  'target',
  email,
  match ? `FOUND id=${match.id}` : 'NOT FOUND — reset email will not be sent for missing users'
)
console.log(
  'all emails:',
  (users?.users || []).map((u) => u.email).join(', ')
)

if (match) {
  console.log('\n=== SEND RESET EMAIL ===')
  const { error } = await pub.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://kintampoafricanmarket.com/auth/confirm?next=/reset-password',
  })
  console.log(error ? `FAIL: ${error.message}` : 'OK — Supabase accepted send request')

  // Also try invite/recovery generate + admin invite style to see mailer errors
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: 'https://kintampoafricanmarket.com/auth/confirm?next=/reset-password' },
  })
  console.log('generateLink:', linkErr ? `FAIL ${linkErr.message}` : `OK action=${Boolean(link?.properties?.action_link)}`)
}
