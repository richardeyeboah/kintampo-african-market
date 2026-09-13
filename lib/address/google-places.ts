import type { AddressSuggestion, ParsedAddress } from '@/lib/address/types'
import { normalizeUsStateCode } from '@/lib/address/us-states'

function apiKey(): string | null {
  return (
    process.env.GOOGLE_PLACES_API_KEY?.trim() ||
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    null
  )
}

export function isGooglePlacesConfigured(): boolean {
  return Boolean(apiKey())
}

type GoogleAddressComponent = {
  longText?: string
  shortText?: string
  types?: string[]
}

function component(
  components: GoogleAddressComponent[],
  type: string,
  useShort = false
): string {
  const hit = components.find((c) => c.types?.includes(type))
  if (!hit) return ''
  return (useShort ? hit.shortText : hit.longText) ?? hit.shortText ?? ''
}

function parseGoogleComponents(components: GoogleAddressComponent[]): ParsedAddress | null {
  const streetNumber = component(components, 'street_number')
  const route = component(components, 'route')
  const line1 = [streetNumber, route].filter(Boolean).join(' ').trim()
  const city =
    component(components, 'locality') ||
    component(components, 'sublocality') ||
    component(components, 'postal_town')
  const state = normalizeUsStateCode(component(components, 'administrative_area_level_1', true))
  const postalCode = component(components, 'postal_code')
  const countryRaw = component(components, 'country', true)
  const country =
    countryRaw === 'US' ? 'United States' : component(components, 'country') || 'United States'

  if (!line1 || !city || !state || !postalCode) return null

  return { line1, city, state, country, postalCode }
}

export async function googlePlacesAutocomplete(input: string): Promise<AddressSuggestion[]> {
  const key = apiKey()
  if (!key || input.trim().length < 3) return []

  const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
    },
    body: JSON.stringify({
      input: input.trim(),
      includedRegionCodes: ['us'],
      includedPrimaryTypes: ['street_address', 'premise', 'subpremise'],
    }),
  })

  if (!res.ok) {
    console.error('[google-places] autocomplete', res.status, await res.text().catch(() => ''))
    return []
  }

  const data = (await res.json()) as {
    suggestions?: Array<{
      placePrediction?: {
        placeId?: string
        text?: { text?: string }
        structuredFormat?: {
          mainText?: { text?: string }
          secondaryText?: { text?: string }
        }
      }
    }>
  }

  const out: AddressSuggestion[] = []
  for (const s of data.suggestions ?? []) {
    const p = s.placePrediction
    if (!p?.placeId?.trim()) continue
    const placeId = p.placeId.trim()
    const primary = p.structuredFormat?.mainText?.text ?? p.text?.text ?? ''
    const secondary = p.structuredFormat?.secondaryText?.text ?? ''
    if (!primary) continue
    out.push({
      id: placeId,
      placeId,
      primary,
      secondary,
      parsed: { line1: primary, city: '', state: '', country: 'United States', postalCode: '' },
      source: 'google',
    })
  }
  return out.slice(0, 8)
}

export async function googlePlaceDetails(placeId: string): Promise<ParsedAddress | null> {
  const key = apiKey()
  if (!key || !placeId.trim()) return null

  const res = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
    {
      headers: {
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'addressComponents,formattedAddress',
      },
    }
  )

  if (!res.ok) {
    console.error('[google-places] details', res.status)
    return null
  }

  const data = (await res.json()) as { addressComponents?: GoogleAddressComponent[] }
  return parseGoogleComponents(data.addressComponents ?? [])
}
