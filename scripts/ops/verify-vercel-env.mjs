/** Print non-secret env readiness (prefixes only). */
const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? ''
const sk = process.env.STRIPE_SECRET_KEY?.trim() ?? ''
const wh = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? ''
const site = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? ''

console.log(JSON.stringify({
  stripe_pk_prefix: pk ? pk.slice(0, 8) : null,
  stripe_sk_prefix: sk ? sk.slice(0, 8) : null,
  stripe_live: pk.startsWith('pk_live_') && sk.startsWith('sk_live_'),
  stripe_test: pk.startsWith('pk_test_') && sk.startsWith('sk_test_'),
  webhook_set: Boolean(wh),
  site_url: site || null,
  site_https: site.startsWith('https://'),
  gmail: Boolean(process.env.GMAIL_USER?.trim()),
  gmail_pass: Boolean(process.env.GMAIL_APP_PASSWORD?.trim()),
  sms_gateway: Boolean(process.env.MERCHANT_SMS_GATEWAY_EMAIL?.trim()),
  merchant_email: Boolean(process.env.MERCHANT_ORDER_EMAIL?.trim()),
  shippo: Boolean(process.env.SHIPPO_API_TOKEN?.trim()),
  admin_session: (process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 32,
}, null, 2))
