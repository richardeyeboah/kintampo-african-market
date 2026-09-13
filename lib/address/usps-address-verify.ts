import {
  cityStateMatchesZip,
  lookupUspsCityState,
} from '@/lib/address/usps-address-lookups'
import type { AddressInput, ParsedAddress } from '@/lib/address/types'
import { normalizeUsStateCode } from '@/lib/address/us-states'
import { getUspsApiConfig } from '@/lib/shipping/usps-config'
import { getUspsOAuthCredentials, getUspsOAuthToken } from '@/lib/shipping/usps-oauth'
/** USPS Addresses API v3 — matches developer.usps.com address response. */
export type UspsAddressValidationResponse = {
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
  additionalInfo?: {
    deliveryPoint?: string
    carrierRoute?: string
    DPVConfirmation?: string
    DPVCMRA?: string
    business?: string
    centralDeliveryPoint?: string
    vacant?: string
  }
  corrections?: Array<{ code?: string; text?: string }>
  matches?: Array<{ code?: string; text?: string }>
  warnings?: string[]
}

export type UspsAddressVerifyResult =
  | {
      ok: true
      standardized: ParsedAddress
      dpvConfirmation: string
      corrections: string[]
      warnings: string[]
    }
  | {
      ok: false
      error: string
      suggested?: ParsedAddress
      corrections: string[]
      warnings: string[]
    }

export function formatPostal(zip?: string, plus4?: string): string {
  const z5 = (zip ?? '').trim().slice(0, 5)
  const p4 = (plus4 ?? '').trim()
  if (!z5) return ''
  return p4.length === 4 ? `${z5}-${p4}` : z5
}

function toTitleCaseWord(word: string): string {
  if (!word) return word
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

export function formatCity(city: string): string {
  return city
    .trim()
    .split(/\s+/)
    .map((w) => toTitleCaseWord(w))
    .join(' ')
}

export function uspsResponseToParsedAddress(data: UspsAddressValidationResponse): ParsedAddress | null {
  const addr = data.address
  if (!addr?.streetAddress || !addr.city || !addr.state) return null

  const line1 = [addr.streetAddress.trim(), addr.secondaryAddress?.trim()].filter(Boolean).join(', ')

  return {
    line1,
    city: formatCity(addr.city),
    state: normalizeUsStateCode(addr.state),
    country: 'United States',
    postalCode: formatPostal(addr.ZIPCode, addr.ZIPPlus4),
  }
}

function collectMessages(items?: Array<{ text?: string }>, warnings?: string[]): string[] {
  const fromItems = (items ?? []).map((i) => i.text?.trim()).filter(Boolean) as string[]
  const fromWarnings = (warnings ?? []).map((w) => w.trim()).filter(Boolean)
  return [...fromItems, ...fromWarnings]
}

function dpvErrorMessage(dpv: string | undefined): string | null {
  switch (dpv?.toUpperCase()) {
    case 'Y':
      return null
    case 'D':
      return 'USPS requires an apartment or suite number for this address.'
    case 'S':
      return 'Apartment or suite could not be confirmed. Check the unit number.'
    case 'N':
      return 'USPS could not confirm this address for delivery.'
    default:
      return 'USPS could not validate this address.'
  }
}

function normStreet(s: string): string {
  const suffix: Record<string, string> = {
    st: 'street',
    str: 'street',
    street: 'street',
    ave: 'avenue',
    av: 'avenue',
    avenue: 'avenue',
    blvd: 'boulevard',
    boulevard: 'boulevard',
    rd: 'road',
    road: 'road',
    dr: 'drive',
    drive: 'drive',
    ln: 'lane',
    lane: 'lane',
    ct: 'court',
    court: 'court',
    pl: 'place',
    place: 'place',
    cir: 'circle',
    circle: 'circle',
    hwy: 'highway',
    highway: 'highway',
    pkwy: 'parkway',
    parkway: 'parkway',
  }
  return s
    .trim()
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => suffix[word] ?? word)
    .join(' ')
}

function inputsMatch(a: AddressInput, b: ParsedAddress): boolean {
  const normCity = (s: string) => s.trim().toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ')
  return (
    normStreet(a.line1) === normStreet(b.line1) &&
    normCity(a.city) === normCity(b.city) &&
    normalizeUsStateCode(a.state) === b.state &&
    a.postalCode.trim().slice(0, 5) === b.postalCode.trim().slice(0, 5)
  )
}

export async function verifyUsAddressUsps(input: AddressInput): Promise<UspsAddressVerifyResult> {
  const creds = getUspsOAuthCredentials()
  if (!creds) {
    return { ok: false, error: 'Address verification is temporarily unavailable.', corrections: [], warnings: [] }
  }

  const state = normalizeUsStateCode(input.state)
  const params = new URLSearchParams({
    streetAddress: input.line1.trim(),
    city: input.city.trim(),
    state,
  })
  const line2 = input.line2?.trim()
  if (line2) params.set('secondaryAddress', line2)
  const zip5 = input.postalCode.trim().slice(0, 5)
  if (zip5) params.set('ZIPCode', zip5)

  try {
    if (/^\d{5}$/.test(zip5)) {
      const cityState = await lookupUspsCityState(zip5)
      if (cityState.ok && !cityStateMatchesZip(input.city, input.state, cityState)) {
        return {
          ok: false,
          error: `ZIP ${zip5} is ${cityState.city}, ${cityState.state}. Update city and state.`,
          suggested: {
            line1: input.line1.trim(),
            city: cityState.city,
            state: cityState.state,
            country: 'United States',
            postalCode: formatPostal(zip5, input.postalCode.trim().slice(6, 10) || undefined),
          },
          corrections: [],
          warnings: [],
        }
      }
    }

    const bearer = await getUspsOAuthToken('addresses')
    const baseUrl = getUspsApiConfig()?.baseUrl ?? creds.baseUrl
    const res = await fetch(`${baseUrl}/addresses/v3/address?${params.toString()}`, {
      headers: { Authorization: `Bearer ${bearer}`, Accept: 'application/json' },
      next: { revalidate: 0 },
    })

    const data = (await res.json().catch(() => ({}))) as UspsAddressValidationResponse & {
      error?: { message?: string }
      message?: string
    }

    if (!res.ok) {
      return {
        ok: false,
        error: data.error?.message ?? data.message ?? 'USPS could not validate this address.',
        corrections: [],
        warnings: [],
      }
    }

    const standardized = uspsResponseToParsedAddress(data)
    const corrections = collectMessages(data.corrections, [])
    const warnings = collectMessages(data.matches, data.warnings)
    const dpv = data.additionalInfo?.DPVConfirmation

    if (data.additionalInfo?.vacant?.toUpperCase() === 'Y') {
      return {
        ok: false,
        error: 'USPS marks this address as vacant.',
        suggested: standardized ?? undefined,
        corrections,
        warnings,
      }
    }

    const dpvError = dpvErrorMessage(dpv)
    if (dpvError) {
      return {
        ok: false,
        error: dpvError,
        suggested: standardized ?? undefined,
        corrections,
        warnings,
      }
    }

    if (!standardized) {
      return {
        ok: false,
        error: 'USPS returned no matching address.',
        corrections,
        warnings,
      }
    }

    return {
      ok: true,
      standardized,
      dpvConfirmation: dpv ?? 'Y',
      corrections,
      warnings,
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'USPS address validation failed.'
    return { ok: false, error: message, corrections: [], warnings: [] }
  }
}

/** True when USPS standardized address differs from what the customer typed. */
export function uspsAddressNeedsCorrection(input: AddressInput, standardized: ParsedAddress): boolean {
  return !inputsMatch(input, standardized)
}
