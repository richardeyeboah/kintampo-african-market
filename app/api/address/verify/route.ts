import { NextRequest, NextResponse } from 'next/server'
import type { AddressInput } from '@/lib/address/types'
import { verifyUsDeliveryAddress } from '@/lib/address/verify-us-address'
import { assertSameOrigin } from '@/lib/security/same-origin'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const originCheck = assertSameOrigin(req)
  if (!originCheck.ok) return originCheck.response

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 })
  }

  const input: AddressInput = {
    line1: typeof body.line1 === 'string' ? body.line1 : typeof body.address === 'string' ? body.address : '',
    line2: typeof body.line2 === 'string' ? body.line2 : '',
    city: typeof body.city === 'string' ? body.city : '',
    state: typeof body.state === 'string' ? body.state : '',
    postalCode:
      typeof body.postalCode === 'string'
        ? body.postalCode
        : typeof body.postal_code === 'string'
          ? body.postal_code
          : '',
    country: typeof body.country === 'string' ? body.country : 'United States',
  }

  const result = await verifyUsDeliveryAddress(input)

  if (result.ok) {
    return NextResponse.json({
      ok: true,
      provider: result.provider,
      standardized: result.standardized ?? null,
    })
  }

  return NextResponse.json({
    ok: false,
    error: result.error,
    suggested: result.suggested ?? null,
    corrections: result.corrections ?? [],
  })
}
