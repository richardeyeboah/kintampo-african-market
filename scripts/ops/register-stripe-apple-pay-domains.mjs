/**
 * Register production domains for Apple Pay / Google Pay (required or wallets stay hidden).
 *
 * Also host public/.well-known/apple-developer-merchantid-domain-association (Stripe file).
 *
 *   npx vercel env run -e production '--' node scripts/register-stripe-apple-pay-domains.mjs
 */

import Stripe from 'stripe'

const key = process.env.STRIPE_SECRET_KEY?.trim()
if (!key) {
  console.error('STRIPE_SECRET_KEY is required.')
  process.exit(1)
}

const stripe = new Stripe(key, { typescript: false })

const domains = ['kintampoafricanmarket.com', 'kintampo-african-market.vercel.app']

for (const domain_name of domains) {
  try {
    const row = await stripe.paymentMethodDomains.create({ domain_name })
    console.log('Payment method domain:', domain_name, row.id)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('already exists') || msg.includes('already registered')) {
      console.log('Already registered (payment method domain):', domain_name)
    } else {
      console.error('Failed payment method domain:', domain_name, msg)
    }
  }

  try {
    const row = await stripe.applePayDomains.create({ domain_name })
    console.log('Apple Pay domain:', domain_name, row.id ?? '')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('already exists') || msg.includes('already registered')) {
      console.log('Already registered (apple pay):', domain_name)
    } else {
      console.error('Failed apple pay:', domain_name, msg)
    }
  }
}

const pmd = await stripe.paymentMethodDomains.list({ limit: 20 })
console.log(
  '\nPayment method domains:',
  pmd.data.map((d) => `${d.domain_name} apple=${d.apple_pay?.status}`).join('\n  ') || '(none)'
)

const apple = await stripe.applePayDomains.list({ limit: 20 })
console.log(
  'Apple Pay domains:',
  apple.data.map((d) => d.domain_name).join(', ') || '(none)'
)

console.log(
  '\nEnsure this URL returns 200 after deploy:\n  https://kintampoafricanmarket.com/.well-known/apple-developer-merchantid-domain-association'
)
