import { isGeoapifyConfigured, verifyUsAddressGeoapify } from '@/lib/address/geoapify-verify'
import type { AddressInput, ParsedAddress } from '@/lib/address/types'
import {
  uspsAddressNeedsCorrection,
  verifyUsAddressUsps,
} from '@/lib/address/usps-address-verify'
import { isUspsAddressApiConfigured } from '@/lib/shipping/usps-oauth'
import { normalizeShippingCountry } from '@/lib/shipping'
import { isValidUsStateCode, normalizeUsStateCode } from '@/lib/address/us-states'

export type { AddressInput } from '@/lib/address/types'

const CENSUS_GEOCODE =
  'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress'

const CENSUS_TIMEOUT_MS = 8_000

export type VerifyUsAddressSuccess = {
  ok: true
  provider: 'usps' | 'geoapify' | 'census'
  /** USPS-standardized address when available — use for shipping labels. */
  standardized?: ParsedAddress
}

export type VerifyUsAddressFailure = {
  ok: false
  error: string
  suggested?: ParsedAddress
  corrections?: string[]
}

export type VerifyUsAddressResult = VerifyUsAddressSuccess | VerifyUsAddressFailure

export function isValidUsZip(postalCode: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(postalCode.trim())
}

export function isUnitedStatesCountry(country: string): boolean {
  const c = normalizeShippingCountry(country)
  return !c || c === 'united states'
}

function basicFieldChecks(input: AddressInput): VerifyUsAddressFailure | null {
  const line1 = input.line1.trim()
  const city = input.city.trim()
  const state = normalizeUsStateCode(input.state)
  const zip = input.postalCode.trim()
  const country = input.country.trim()

  if (!isUnitedStatesCountry(country)) {
    return { ok: false, error: 'US delivery requires United States as the country.' }
  }
  if (line1.length < 5) {
    return { ok: false, error: 'Enter a complete street address.' }
  }
  if (!city) {
    return { ok: false, error: 'City is required.' }
  }
  if (!isValidUsStateCode(state)) {
    return { ok: false, error: 'Choose a valid US state.' }
  }
  if (!isValidUsZip(zip)) {
    return { ok: false, error: 'Enter a valid 5-digit ZIP code.' }
  }
  return null
}

/**
 * Verifies a US street address — USPS Addresses API (official DPV) when configured,
 * then Geoapify, then US Census geocoder.
 */
export async function verifyUsDeliveryAddress(input: AddressInput): Promise<VerifyUsAddressResult> {
  const fieldError = basicFieldChecks(input)
  if (fieldError) return fieldError

  if (isUspsAddressApiConfigured()) {
    const usps = await verifyUsAddressUsps(input)
    if (usps.ok) {
      if (uspsAddressNeedsCorrection(input, usps.standardized)) {
        return {
          ok: false,
          error: 'USPS standardized this address. Use the suggested format to continue.',
          suggested: usps.standardized,
          corrections: usps.corrections,
        }
      }
      return { ok: true, provider: 'usps', standardized: usps.standardized }
    }
    return {
      ok: false,
      error: usps.error,
      suggested: usps.suggested,
      corrections: usps.corrections,
    }
  }

  if (isGeoapifyConfigured()) {
    const geo = await verifyUsAddressGeoapify(input)
    if (geo.ok) return { ok: true, provider: 'geoapify' }
    return { ok: false, error: geo.error }
  }

  const line1 = input.line1.trim()
  const city = input.city.trim()
  const state = normalizeUsStateCode(input.state)
  const zip = input.postalCode.trim()
  const oneLine = [line1, input.line2?.trim(), city, state, zip].filter(Boolean).join(', ')

  try {
    const params = new URLSearchParams({
      address: oneLine,
      benchmark: 'Public_AR_Current',
      format: 'json',
    })
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), CENSUS_TIMEOUT_MS)
    const res = await fetch(`${CENSUS_GEOCODE}?${params.toString()}`, {
      next: { revalidate: 0 },
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) {
      return { ok: false, error: 'Could not verify this address. Pick one from the suggestions.' }
    }
    const data = (await res.json()) as {
      result?: { addressMatches?: unknown[] }
    }
    const matches = data?.result?.addressMatches ?? []
    if (!Array.isArray(matches) || matches.length === 0) {
      return {
        ok: false,
        error: 'This address could not be verified. Select a US address from the list as you type.',
      }
    }
    return { ok: true, provider: 'census' }
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError'
    if (aborted) {
      return {
        ok: false,
        error:
          'Address verification timed out. Add USPS_API_CLIENT_ID or GEOAPIFY_API_KEY on Vercel for faster verification.',
      }
    }
    return { ok: false, error: 'Address verification is temporarily unavailable. Try again.' }
  }
}

export type ResolvedShippingAddress = {
  line1: string
  line2: string
  city: string
  state: string
  postalCode: string
}

/** Prefer USPS-standardized fields for labels and order records. */
export function resolveShippingAddress(
  input: AddressInput,
  verified: VerifyUsAddressSuccess
): ResolvedShippingAddress {
  const s = verified.standardized
  if (s) {
    return {
      line1: s.line1,
      line2: input.line2?.trim() ?? '',
      city: s.city,
      state: s.state,
      postalCode: s.postalCode,
    }
  }
  return {
    line1: input.line1.trim(),
    line2: input.line2?.trim() ?? '',
    city: input.city.trim(),
    state: normalizeUsStateCode(input.state),
    postalCode: input.postalCode.trim(),
  }
}

export function formatAddressLine(resolved: ResolvedShippingAddress): string {
  return [resolved.line1, resolved.line2].filter(Boolean).join(', ')
}
