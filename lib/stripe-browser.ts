import { loadStripe, type Stripe } from '@stripe/stripe-js'

/**
 * Load Stripe.js with the publishable key from env.
 *
 * IMPORTANT: this returns `null` if NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing
 * or empty. Previously we fell back to Stripe's universal demo key, but that key
 * belongs to a different Stripe account than your STRIPE_SECRET_KEY — Stripe
 * silently rejects the PaymentIntent confirm and the Pay button hangs forever.
 *
 * Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in `.env.local` AND on Vercel.
 */
let stripePromise: Promise<Stripe | null> | null = null

export function getStripeBrowser(): Promise<Stripe | null> {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()
  if (!key) return Promise.resolve(null)
  if (!stripePromise) stripePromise = loadStripe(key)
  return stripePromise
}

export function isStripePublishableKeyConfigured(): boolean {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()
  return !!key && key.length > 0
}
