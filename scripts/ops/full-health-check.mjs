/**
 * Full production health check — run with:
 *   npx vercel env pull .env.vercel.tmp --environment=production --yes
 *   node --env-file=.env.vercel.tmp scripts/full-health-check.mjs
 *
 * Does NOT buy postage / create paid Shippo labels.
 */
import nodemailer from 'nodemailer'

const SITE = 'https://kintampoafricanmarket.com'
const results = []

function pass(name, detail = '') {
  results.push({ ok: true, name, detail })
  console.log(`✅ PASS  ${name}${detail ? ` — ${detail}` : ''}`)
}
function fail(name, detail = '') {
  results.push({ ok: false, name, detail })
  console.log(`❌ FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
}
function warn(name, detail = '') {
  results.push({ ok: null, name, detail })
  console.log(`⚠️  WARN  ${name}${detail ? ` — ${detail}` : ''}`)
}

async function checkHttp(path, expectStatus = 200) {
  const res = await fetch(`${SITE}${path}`, { redirect: 'follow' })
  return { status: res.status, ok: res.status === expectStatus, text: await res.text() }
}

console.log('\n=== 1. LIVE SITE PAGES ===')
for (const path of ['/', '/shop', '/checkout', '/admin/login', '/track-order', '/feedback']) {
  try {
    const r = await checkHttp(path)
    if (r.ok) pass(`GET ${path}`, `HTTP ${r.status}`)
    else fail(`GET ${path}`, `HTTP ${r.status}`)
  } catch (e) {
    fail(`GET ${path}`, e.message)
  }
}

console.log('\n=== 2. HOMEPAGE CONTENT ===')
try {
  const { text: html } = await checkHttp('/')
  if (html.includes('377-8297')) pass('Store phone (614) 377-8297')
  else fail('Store phone (614) 377-8297', 'not found')
  if (!html.includes('446-0893')) pass('Old phone removed')
  else fail('Old phone removed', '446-0893 still present')
  if (html.includes('kalebdoffour')) pass('Support email kalebdoffour@gmail.com')
  else fail('Support email', 'kalebdoffour not found')
  if (!html.includes('kkras5050')) pass('Old Gmail removed from homepage')
  else fail('Old Gmail removed', 'kkras5050 still present')
  if (!/launching soon|braiding/i.test(html) && !html.includes('Fashion')) {
    pass('Fashion / braiding placeholder gone')
  } else {
    fail('Fashion / braiding placeholder gone', 'still found on homepage')
  }
} catch (e) {
  fail('Homepage content', e.message)
}

console.log('\n=== 3. STRIPE LIVE KEY IN CHECKOUT JS ===')
try {
  const { text: html } = await checkHttp('/checkout')
  const paths = [...new Set([...html.matchAll(/\/_next\/static\/[^"'\s]+\.js/g)].map((m) => m[0]))]
  let found = null
  for (const path of paths) {
    const js = await fetch(SITE + path).then((r) => r.text())
    const m = js.match(/pk_(live|test)_[A-Za-z0-9]+/)
    if (m) {
      found = m[0]
      break
    }
  }
  if (found?.startsWith('pk_live_')) pass('Stripe publishable key', `pk_live_… (${found.slice(0, 15)}…)`)
  else if (found?.startsWith('pk_test_')) fail('Stripe publishable key', 'still TEST mode')
  else warn('Stripe publishable key', 'not found in checkout JS (may load client-side only)')
} catch (e) {
  fail('Stripe publishable key', e.message)
}

console.log('\n=== 4. VERCEL ENV (pulled) ===')
const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? ''
const sk = process.env.STRIPE_SECRET_KEY?.trim() ?? ''
const wh = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? ''
const site = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? ''
const gmail = process.env.GMAIL_USER?.trim() ?? ''
const gmailPass = process.env.GMAIL_APP_PASSWORD?.trim()?.replace(/\s+/g, '') ?? ''
const merchant = process.env.MERCHANT_ORDER_EMAIL?.trim() ?? ''
const sms = process.env.MERCHANT_SMS_GATEWAY_EMAIL?.trim() ?? ''
const shippo = process.env.SHIPPO_API_TOKEN?.trim() ?? ''
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? ''
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? ''
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? ''

if (pk.startsWith('pk_live_') && sk.startsWith('sk_live_')) pass('Stripe keys live', `${pk.slice(0, 12)}… / ${sk.slice(0, 12)}…`)
else fail('Stripe keys live', `pk=${pk.slice(0, 8) || 'missing'} sk=${sk.slice(0, 8) || 'missing'}`)
if (wh.startsWith('whsec_')) pass('Stripe webhook secret set')
else fail('Stripe webhook secret set', 'missing or wrong prefix')
if (site === 'https://kintampoafricanmarket.com') pass('NEXT_PUBLIC_SITE_URL', site)
else fail('NEXT_PUBLIC_SITE_URL', site || 'missing')
if (gmail === 'kalebdoffour@gmail.com' && gmailPass.length >= 16) pass('Gmail credentials', gmail)
else fail('Gmail credentials', `user=${gmail || 'missing'} pass=${gmailPass ? 'set' : 'missing'}`)
if (merchant === 'kalebdoffour@gmail.com') pass('MERCHANT_ORDER_EMAIL', merchant)
else fail('MERCHANT_ORDER_EMAIL', merchant || 'missing')
if (sms === '6143778297@tmomail.net') pass('SMS gateway', sms)
else warn('SMS gateway', sms || 'missing — expected 6143778297@tmomail.net')
if (shippo.startsWith('shippo_live_')) pass('Shippo live token', `${shippo.slice(0, 18)}…`)
else fail('Shippo live token', shippo ? `${shippo.slice(0, 18)}…` : 'missing')
if (supabaseUrl && supabaseAnon && serviceRole) pass('Supabase keys present')
else fail('Supabase keys present', 'one or more missing')

console.log('\n=== 5. GMAIL SMTP LOGIN + TEST SEND ===')
if (gmail && gmailPass) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmail, pass: gmailPass },
    })
    await transporter.verify()
    pass('Gmail SMTP login')
    await transporter.sendMail({
      from: `Kintampo African Market <${gmail}>`,
      to: gmail,
      subject: 'Health check: email OK',
      text: 'Automated start-to-finish health check. Email alerts are working.',
    })
    pass('Gmail test email sent', `to ${gmail}`)
    if (sms) {
      await transporter.sendMail({
        from: `Kintampo African Market <${gmail}>`,
        to: sms,
        subject: '',
        text: 'Health check SMS — order alerts pipeline OK.',
      })
      pass('SMS gateway send', `to ${sms}`)
    }
  } catch (e) {
    fail('Gmail / SMS send', e.message)
  }
} else {
  fail('Gmail / SMS send', 'credentials missing')
}

console.log('\n=== 6. SHIPPO LIVE API (rate quote only — no paid label) ===')
if (shippo.startsWith('shippo_live_')) {
  try {
    const res = await fetch('https://api.goshippo.com/shipments/', {
      method: 'POST',
      headers: {
        Authorization: `ShippoToken ${shippo}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address_from: { zip: '43229', country: 'US' },
        address_to: { zip: '10001', country: 'US' },
        parcels: [
          {
            weight: '3',
            length: '12',
            width: '10',
            height: '8',
            distance_unit: 'in',
            mass_unit: 'lb',
          },
        ],
        async: false,
      }),
    })
    const json = await res.json()
    if (!res.ok) {
      fail('Shippo rate quote', json.message || json.detail || `HTTP ${res.status}`)
    } else {
      const usps = (json.rates ?? []).filter((r) =>
        String(r.provider || '').toUpperCase().includes('USPS')
      )
      const ground =
        usps.find((r) => String(r.servicelevel?.token || '').toUpperCase().includes('GROUND')) ||
        usps[0]
      if (ground?.amount) {
        pass(
          'Shippo rate quote',
          `Columbus→NYC 3lb ≈ $${ground.amount} (${ground.servicelevel?.name || ground.servicelevel?.token})`
        )
      } else {
        warn('Shippo rate quote', `HTTP ${res.status} but no USPS rates returned`)
      }
    }
  } catch (e) {
    fail('Shippo rate quote', e.message)
  }
} else {
  fail('Shippo rate quote', 'no live token')
}

console.log('\n=== 7. SUPABASE checkout_snapshots TABLE ===')
if (supabaseUrl && serviceRole) {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/checkout_snapshots?select=id&limit=1`, {
      headers: {
        apikey: serviceRole,
        Authorization: `Bearer ${serviceRole}`,
        Prefer: 'count=exact',
      },
    })
    if (res.status === 200 || res.status === 206) pass('checkout_snapshots table exists')
    else if (res.status === 404 || res.status === 406) {
      const body = await res.text()
      if (body.includes('PGRST205') || body.includes('does not exist')) {
        fail('checkout_snapshots table exists', 'missing — checkout will fail')
      } else {
        fail('checkout_snapshots table exists', `HTTP ${res.status}: ${body.slice(0, 120)}`)
      }
    } else {
      const body = await res.text()
      fail('checkout_snapshots table exists', `HTTP ${res.status}: ${body.slice(0, 120)}`)
    }
  } catch (e) {
    fail('checkout_snapshots table exists', e.message)
  }
} else {
  fail('checkout_snapshots table exists', 'Supabase env missing')
}

console.log('\n=== 8. STRIPE API PING ===')
if (sk.startsWith('sk_live_')) {
  try {
    const res = await fetch('https://api.stripe.com/v1/balance', {
      headers: { Authorization: `Bearer ${sk}` },
    })
    if (res.ok) pass('Stripe secret key accepted by Stripe API')
    else fail('Stripe secret key', `HTTP ${res.status}`)
  } catch (e) {
    fail('Stripe secret key', e.message)
  }
}

console.log('\n=== 9. APPLE PAY DOMAIN FILE ===')
try {
  const res = await fetch(
    `${SITE}/.well-known/apple-developer-merchantid-domain-association`
  )
  if (res.ok) pass('Apple Pay domain association file', `HTTP ${res.status}, ${res.headers.get('content-length') || '?'} bytes`)
  else fail('Apple Pay domain association file', `HTTP ${res.status}`)
} catch (e) {
  fail('Apple Pay domain association file', e.message)
}

console.log('\n=== SUMMARY ===')
const passed = results.filter((r) => r.ok === true).length
const failed = results.filter((r) => r.ok === false).length
const warned = results.filter((r) => r.ok === null).length
console.log(`Passed: ${passed}  Failed: ${failed}  Warnings: ${warned}`)
if (failed > 0) {
  console.log('\nFailed checks:')
  for (const r of results.filter((x) => x.ok === false)) {
    console.log(`  - ${r.name}: ${r.detail}`)
  }
  process.exit(1)
}
process.exit(0)
