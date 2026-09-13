import type { AddressSuggestion, ParsedAddress } from '@/lib/address/types'
import { normalizeUsStateCode } from '@/lib/address/us-states'
import { isValidUsZip } from '@/lib/address/verify-us-address'

function apiKey(): string | null {
  return process.env.GEOAPIFY_API_KEY?.trim() || null
}

export function isGeoapifyConfigured(): boolean {
  return Boolean(apiKey())
}

type GeoapifyFeature = {
  properties?: {
    formatted?: string
    address_line1?: string
    address_line2?: string
    housenumber?: string
    street?: string
    city?: string
    state?: string
    state_code?: string
    postcode?: string
    country?: string
    country_code?: string
  }
}

function parseFeature(f: GeoapifyFeature): AddressSuggestion | null {
  const p = f.properties
  if (!p) return null
  if (p.country_code && p.country_code.toLowerCase() !== 'us') return null

  const line1 =
    p.address_line1?.trim() ||
    [p.housenumber, p.street].filter(Boolean).join(' ').trim() ||
    ''
  const city = p.city?.trim() ?? ''
  const state = normalizeUsStateCode(p.state_code || p.state)
  const postal = (p.postcode ?? '').trim().slice(0, 10)

  if (!line1 || !city || !state || !isValidUsZip(postal.slice(0, 5))) {
    return null
  }

  const parsed: ParsedAddress = {
    line1,
    city,
    state,
    country: 'United States',
    postalCode: postal.slice(0, 5),
  }

  const id = [line1, city, state, postal].join('|')
  const secondary =
    p.address_line2?.trim() ||
    p.formatted?.trim() ||
    `${city}, ${state} ${postal.slice(0, 5)}`

  return {
    id,
    primary: line1,
    secondary,
    parsed,
    source: 'geoapify',
  }
}

/** Geoapify US address autocomplete — simple API key, free tier ~3000 req/day. */
export async function geoapifyUsAutocomplete(input: string): Promise<AddressSuggestion[]> {
  const key = apiKey()
  const trimmed = input.trim()
  if (!key || trimmed.length < 3) return []

  const params = new URLSearchParams({
    text: trimmed,
    format: 'json',
    apiKey: key,
    filter: 'countrycode:us',
    limit: '8',
    lang: 'en',
  })

  const res = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?${params.toString()}`)
  if (!res.ok) {
    console.error('[geoapify] autocomplete', res.status)
    return []
  }

  const data = (await res.json()) as { features?: GeoapifyFeature[] }
  const list: AddressSuggestion[] = []
  const seen = new Set<string>()

  for (const f of data.features ?? []) {
    const s = parseFeature(f)
    if (s && !seen.has(s.id)) {
      seen.add(s.id)
      list.push(s)
    }
  }
  return list
}
