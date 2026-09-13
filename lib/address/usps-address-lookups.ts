import type { ParsedAddress } from '@/lib/address/types'
import { normalizeUsStateCode } from '@/lib/address/us-states'
import {
  formatCity,
  formatPostal,
  uspsResponseToParsedAddress,
  type UspsAddressValidationResponse,
} from '@/lib/address/usps-address-verify'
import { getUspsApiConfig } from '@/lib/shipping/usps-config'
import { getUspsOAuthCredentials, getUspsOAuthToken } from '@/lib/shipping/usps-oauth'

/** GET /addresses/v3/city-state — city and state for a ZIP Code. */
export type UspsCityStateResponse = {
  city?: string
  state?: string
}

/** GET /addresses/v3/zipcode — ZIP Code (+4) for street + city + state. */
export type UspsZipCodeResponse = {
  firm?: string | null
  address?: {
    streetAddress?: string
    streetAddressAbbreviation?: string
    secondaryAddress?: string
    city?: string
    cityAbbreviation?: string
    state?: string
    ZIPCode?: string
    ZIPPlus4?: string
    urbanization?: string
  }
}

export type UspsCityStateResult =
  | { ok: true; city: string; state: string }
  | { ok: false; error: string }

export type UspsZipCodeResult =
  | { ok: true; standardized: ParsedAddress }
  | { ok: false; error: string; suggested?: ParsedAddress }

async function uspsAddressesFetch(
  path: string,
  params: URLSearchParams
): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  const creds = getUspsOAuthCredentials()
  if (!creds) {
    return { ok: false, error: 'Address lookup is temporarily unavailable.' }
  }

  try {
    const bearer = await getUspsOAuthToken('addresses')
    const baseUrl = getUspsApiConfig()?.baseUrl ?? creds.baseUrl
    const res = await fetch(`${baseUrl}/addresses/v3/${path}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${bearer}`, Accept: 'application/json' },
      next: { revalidate: 0 },
    })

    const data = (await res.json().catch(() => ({}))) as {
      error?: { message?: string }
      message?: string
    }

    if (!res.ok) {
      return {
        ok: false,
        error: data.error?.message ?? data.message ?? 'USPS lookup failed.',
      }
    }

    return { ok: true, data }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'USPS lookup failed.'
    return { ok: false, error: message }
  }
}

/** Returns official city and state for a 5-digit ZIP (e.g. 50314 → Des Moines, IA). */
export async function lookupUspsCityState(zipCode: string): Promise<UspsCityStateResult> {
  const zip5 = zipCode.trim().slice(0, 5)
  if (!/^\d{5}$/.test(zip5)) {
    return { ok: false, error: 'Enter a valid 5-digit ZIP code.' }
  }

  const params = new URLSearchParams({ ZIPCode: zip5 })
  const result = await uspsAddressesFetch('city-state', params)
  if (!result.ok) return result

  const data = result.data as UspsCityStateResponse
  const city = data.city?.trim()
  const state = data.state?.trim()
  if (!city || !state) {
    return { ok: false, error: 'USPS has no city/state for this ZIP code.' }
  }

  return {
    ok: true,
    city: formatCity(city),
    state: normalizeUsStateCode(state),
  }
}

/** Returns validated ZIP (+4) for street + city + state. */
export async function lookupUspsZipCode(input: {
  streetAddress: string
  city: string
  state: string
  secondaryAddress?: string
  zipCode?: string
}): Promise<UspsZipCodeResult> {
  const streetAddress = input.streetAddress.trim()
  const city = input.city.trim()
  const state = normalizeUsStateCode(input.state)

  if (streetAddress.length < 3 || !city || !state) {
    return { ok: false, error: 'Street, city, and state are required for ZIP lookup.' }
  }

  const params = new URLSearchParams({
    streetAddress,
    city,
    state,
  })
  const line2 = input.secondaryAddress?.trim()
  if (line2) params.set('secondaryAddress', line2)
  const zip5 = input.zipCode?.trim().slice(0, 5)
  if (zip5 && /^\d{5}$/.test(zip5)) params.set('ZIPCode', zip5)

  const result = await uspsAddressesFetch('zipcode', params)
  if (!result.ok) return result

  const data = result.data as UspsZipCodeResponse
  const asAddressResponse: UspsAddressValidationResponse = {
    firm: data.firm,
    address: data.address,
  }
  const standardized = uspsResponseToParsedAddress(asAddressResponse)
  if (!standardized?.postalCode) {
    return { ok: false, error: 'USPS returned no ZIP code for this address.' }
  }

  return { ok: true, standardized }
}

function normCity(s: string): string {
  return s.trim().toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ')
}

/** True when typed city/state do not match USPS city-state for this ZIP. */
export function cityStateMatchesZip(
  city: string,
  state: string,
  usps: { city: string; state: string }
): boolean {
  return normCity(city) === normCity(usps.city) && normalizeUsStateCode(state) === usps.state
}

export function parsedFromCityStateZip(
  city: string,
  state: string,
  zipCode: string
): ParsedAddress {
  return {
    line1: '',
    city: formatCity(city),
    state: normalizeUsStateCode(state),
    country: 'United States',
    postalCode: formatPostal(zipCode.slice(0, 5), zipCode.includes('-') ? zipCode.slice(-4) : undefined),
  }
}
