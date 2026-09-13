import { NextRequest, NextResponse } from 'next/server'
import { geoapifyUsAutocomplete, isGeoapifyConfigured } from '@/lib/address/geoapify-autocomplete'
import { googlePlacesAutocomplete, isGooglePlacesConfigured } from '@/lib/address/google-places'
import { photonUsAutocomplete } from '@/lib/address/photon-autocomplete'
import { assertSameOrigin } from '@/lib/security/same-origin'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const originCheck = assertSameOrigin(req)
  if (!originCheck.ok) return originCheck.response

  let input = ''
  try {
    const body = await req.json()
    input = typeof body.input === 'string' ? body.input.trim() : ''
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  if (input.length < 3) {
    return NextResponse.json({ suggestions: [], provider: 'none' })
  }

  if (isGeoapifyConfigured()) {
    const suggestions = await geoapifyUsAutocomplete(input)
    if (suggestions.length > 0) {
      return NextResponse.json({ suggestions, provider: 'geoapify' })
    }
  }

  if (isGooglePlacesConfigured()) {
    const suggestions = await googlePlacesAutocomplete(input)
    return NextResponse.json({ suggestions, provider: 'google' })
  }

  const suggestions = await photonUsAutocomplete(input)
  return NextResponse.json({ suggestions, provider: 'photon' })
}
