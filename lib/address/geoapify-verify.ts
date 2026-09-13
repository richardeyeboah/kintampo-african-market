import { isGeoapifyConfigured } from '@/lib/address/geoapify-autocomplete'
import type { AddressInput } from '@/lib/address/types'
import { normalizeUsStateCode } from '@/lib/address/us-states'

export { isGeoapifyConfigured }

function isZip5(postalCode: string): boolean {
  return /^\d{5}/.test(postalCode.trim())
}

type GeoapifyResult = {
  country_code?: string
  state_code?: string
  state?: string
  city?: string
  postcode?: string
  street?: string
  housenumber?: string
  address_line1?: string
  rank?: { confidence?: number; match_type?: string }
}

function apiKey(): string | null {
  return process.env.GEOAPIFY_API_KEY?.trim() || null
}

function normalizeToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
}

function buildLine1FromResult(r: GeoapifyResult): string {
  return (
    r.address_line1?.trim() ||
    [r.housenumber, r.street].filter(Boolean).join(' ').trim() ||
    ''
  )
}

function line1Matches(inputLine1: string, result: GeoapifyResult): boolean {
  const a = normalizeToken(inputLine1)
  const b = normalizeToken(buildLine1FromResult(result))
  if (!a || !b) return false
  return a === b || a.includes(b) || b.includes(a)
}

function resultMatchesInput(input: AddressInput, r: GeoapifyResult): boolean {
  if (r.country_code && r.country_code.toLowerCase() !== 'us') return false

  const state = normalizeUsStateCode(input.state)
  const resultState = normalizeUsStateCode(r.state_code || r.state)
  if (!state || resultState !== state) return false

  const zip5 = input.postalCode.trim().slice(0, 5)
  const resultZip = (r.postcode ?? '').trim().slice(0, 5)
  if (!isZip5(zip5) || resultZip !== zip5) return false

  const cityIn = normalizeToken(input.city)
  const cityResult = normalizeToken(r.city ?? '')
  if (cityIn && cityResult && cityIn !== cityResult) return false

  if (!line1Matches(input.line1, r)) return false

  const confidence = r.rank?.confidence ?? 0
  const matchType = r.rank?.match_type ?? ''
  if (matchType === 'full_match' || confidence >= 0.85) return true
  return confidence >= 0.5 && Boolean(r.housenumber)
}

/**
 * Confirms a US address via Geoapify forward geocode (same provider as checkout autocomplete).
 */
export async function verifyUsAddressGeoapify(
  input: AddressInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = apiKey()
  if (!key) {
    return { ok: false, error: 'Address verification is temporarily unavailable.' }
  }

  const line1 = input.line1.trim()
  const city = input.city.trim()
  const state = normalizeUsStateCode(input.state)
  const zip = input.postalCode.trim().slice(0, 5)
  const oneLine = [line1, input.line2?.trim(), city, state, zip].filter(Boolean).join(', ')

  const params = new URLSearchParams({
    text: oneLine,
    format: 'json',
    apiKey: key,
    filter: 'countrycode:us',
    limit: '5',
    lang: 'en',
  })

  try {
    const res = await fetch(`https://api.geoapify.com/v1/geocode/search?${params.toString()}`, {
      next: { revalidate: 0 },
    })
    if (!res.ok) {
      console.error('[geoapify] verify', res.status)
      return { ok: false, error: 'Could not verify this address. Pick one from the suggestions.' }
    }

    const data = (await res.json()) as { results?: GeoapifyResult[] }
    const match = (data.results ?? []).find((r) => resultMatchesInput(input, r))
    if (!match) {
      return {
        ok: false,
        error: 'This address could not be verified. Select a US address from the list as you type.',
      }
    }
    return { ok: true }
  } catch {
    return { ok: false, error: 'Address verification is temporarily unavailable. Try again.' }
  }
}
