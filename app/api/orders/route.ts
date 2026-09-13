import { NextResponse } from 'next/server'

/**
 * Orders are created only after Stripe payment succeeds (webhook).
 * Use POST /api/checkout/session to start Stripe Checkout.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        'Direct order creation is disabled. Complete payment with Stripe Checkout — orders are created after payment succeeds.',
    },
    { status: 410 }
  )
}
