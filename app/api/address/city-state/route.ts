import { NextRequest, NextResponse } from 'next/server'
import { lookupUspsCityState } from '@/lib/address/usps-address-lookups'
import { isUspsAddressApiConfigured } from '@/lib/shipping/usps-oauth'
import { assertSameOrigin } from '@/lib/security/same-origin'

export const runtime = 'nodejs'

/** GET /api/address/city-state?ZIPCode=50314 — USPS city/state for a ZIP. */
export async function GET(req: NextRequest) {
  const originCheck = assertSameOrigin(req)
  if (!originCheck.ok) return originCheck.response

  if (!isUspsAddressApiConfigured()) {
    return NextResponse.json({ error: 'Address lookup is temporarily unavailable.' }, { status: 503 })
  }

  const zip =
    req.nextUrl.searchParams.get('ZIPCode')?.trim() ??
    req.nextUrl.searchParams.get('zip')?.trim() ??
    ''

  const result = await lookupUspsCityState(zip)
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 })
  }

  return NextResponse.json({
    ok: true,
    city: result.city,
    state: result.state,
    ZIPCode: zip.slice(0, 5),
  })
}
