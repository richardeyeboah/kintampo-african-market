import Stripe from 'stripe'

/** Card + wallets (Apple Pay / Google Pay). Excludes Klarna, Amazon Pay, BNPL, etc. */
export const CHECKOUT_STRIPE_PAYMENT_METHOD_TYPES = ['card'] as const

let stripeSingleton: Stripe | null = null

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key, { typescript: true })
  }
  return stripeSingleton
}
