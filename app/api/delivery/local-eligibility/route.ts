import { NextRequest, NextResponse } from 'next/server'
import type { AddressInput } from '@/lib/address/types'
import { checkLocalDeliveryEligibility } from '@/lib/delivery/local-delivery-eligibility'
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
    line1: typeof body.line1 === 'string' ? body.line1 : '',
    line2: typeof body.line2 === 'string' ? body.line2 : '',
    city: typeof body.city === 'string' ? body.city : '',
    state: typeof body.state === 'string' ? body.state : '',
    postalCode: typeof body.postalCode === 'string' ? body.postalCode : '',
    country: typeof body.country === 'string' ? body.country : 'United States',
  }

  if (!input.line1 || !input.city || !input.state || !input.postalCode) {
    return NextResponse.json({ error: 'Missing address fields.' }, { status: 400 })
  }

  const result = await checkLocalDeliveryEligibility(input)

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 200 })
  }

  return NextResponse.json({ ok: true, eligible: result.eligible, minutes: result.minutes })
}
