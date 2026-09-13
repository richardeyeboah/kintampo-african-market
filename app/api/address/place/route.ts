import { NextRequest, NextResponse } from 'next/server'
import { googlePlaceDetails, isGooglePlacesConfigured } from '@/lib/address/google-places'
import { assertSameOrigin } from '@/lib/security/same-origin'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const originCheck = assertSameOrigin(req)
  if (!originCheck.ok) return originCheck.response

  if (!isGooglePlacesConfigured()) {
    return NextResponse.json({ error: 'Place details not available.' }, { status: 503 })
  }

  let placeId = ''
  try {
    const body = await req.json()
    placeId = typeof body.placeId === 'string' ? body.placeId.trim() : ''
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  if (!placeId) {
    return NextResponse.json({ error: 'placeId is required.' }, { status: 400 })
  }

  const address = await googlePlaceDetails(placeId)
  if (!address) {
    return NextResponse.json({ error: 'Could not load address details.' }, { status: 404 })
  }

  return NextResponse.json({ address })
}
