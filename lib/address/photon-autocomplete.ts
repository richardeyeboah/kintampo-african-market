import type { AddressSuggestion, ParsedAddress } from '@/lib/address/types'
import { normalizeUsStateCode } from '@/lib/address/us-states'
import { isValidUsZip } from '@/lib/address/verify-us-address'

const PHOTON_ENDPOINT = 'https://photon.komoot.io/api'
const US_BBOX = '-125.0,24.0,-66.0,49.5'

type PhotonProps = {
  housenumber?: string
  street?: string
  name?: string
  city?: string
  town?: string
  village?: string
  hamlet?: string
  state?: string
  postcode?: string
  country?: string
}

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] }
  properties: PhotonProps
}

function buildStrictUsSuggestion(f: PhotonFeature): AddressSuggestion | null {
  const p = f.properties
  const housenumber = p.housenumber?.trim() ?? ''
  const street = p.street?.trim() ?? ''
  const city = (p.city ?? p.town ?? p.village ?? p.hamlet ?? '').trim()
  const state = normalizeUsStateCode(p.state)
  const postal = (p.postcode ?? '').trim().slice(0, 5)
  const country = (p.country ?? '').trim().toLowerCase()

  if (country && country !== 'united states' && country !== 'usa' && country !== 'us') {
    return null
  }
  if (!housenumber || !street || !city || !state || !isValidUsZip(postal)) {
    return null
  }

  const line1 = `${housenumber} ${street}`.trim()
  const parsed: ParsedAddress = {
    line1,
    city,
    state,
    country: 'United States',
    postalCode: postal,
  }

  const id = [line1, city, state, postal].join('|')
  return {
    id,
    primary: line1,
    secondary: `${city}, ${state} ${postal}`,
    parsed,
    source: 'photon',
  }
}

/** Fallback US autocomplete — only complete street addresses with ZIP. */
export async function photonUsAutocomplete(input: string): Promise<AddressSuggestion[]> {
  const trimmed = input.trim()
  if (trimmed.length < 3) return []

  const params = new URLSearchParams({
    q: trimmed,
    limit: '10',
    lang: 'en',
    bbox: US_BBOX,
    lat: '39.9612',
    lon: '-82.9988',
  })

  const res = await fetch(`${PHOTON_ENDPOINT}?${params.toString()}`)
  if (!res.ok) return []

  const data = (await res.json()) as { features?: PhotonFeature[] }
  const list: AddressSuggestion[] = []
  const seen = new Set<string>()

  for (const f of data.features ?? []) {
    const s = buildStrictUsSuggestion(f)
    if (s && !seen.has(s.id)) {
      seen.add(s.id)
      list.push(s)
    }
  }
  return list.slice(0, 8)
}
