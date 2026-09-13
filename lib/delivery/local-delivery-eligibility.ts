import type { AddressInput } from '@/lib/address/types'
import { STORE } from '@/lib/constants/store'

/** Local "mobile market" delivery only covers addresses this close by car. */
export const LOCAL_DELIVERY_MAX_MINUTES = 30

function apiKey(): string | null {
  return process.env.GEOAPIFY_API_KEY?.trim() || null
}

type Coordinates = { lat: number; lon: number }

type GeoapifyGeocodeResult = {
  country_code?: string
  lat?: number
  lon?: number
  rank?: { confidence?: number }
}

async function geocodeOneLine(oneLine: string): Promise<Coordinates | null> {
  const key = apiKey()
  if (!key) return null

  const params = new URLSearchParams({
    text: oneLine,
    format: 'json',
    apiKey: key,
    filter: 'countrycode:us',
    limit: '1',
    lang: 'en',
  })

  try {
    const res = await fetch(`https://api.geoapify.com/v1/geocode/search?${params.toString()}`, {
      next: { revalidate: 0 },
    })
    if (!res.ok) {
      console.error('[geoapify] geocode for routing', res.status)
      return null
    }
    const data = (await res.json()) as { results?: GeoapifyGeocodeResult[] }
    const match = (data.results ?? [])[0]
    if (!match || typeof match.lat !== 'number' || typeof match.lon !== 'number') return null
    return { lat: match.lat, lon: match.lon }
  } catch {
    return null
  }
}

function addressToOneLine(input: AddressInput): string {
  return [input.line1.trim(), input.line2?.trim(), input.city.trim(), input.state.trim(), input.postalCode.trim()]
    .filter(Boolean)
    .join(', ')
}

// The store address never changes, so its coordinates are geocoded once per
// server process and reused — no need to hit Geoapify on every checkout.
let storeCoordinatesPromise: Promise<Coordinates | null> | null = null

function getStoreCoordinates(): Promise<Coordinates | null> {
  if (!storeCoordinatesPromise) {
    storeCoordinatesPromise = geocodeOneLine(STORE.address)
  }
  return storeCoordinatesPromise
}

/** Real driving time in minutes between the store and a destination, via Geoapify Routing. */
async function getDrivingMinutes(dest: Coordinates): Promise<number | null> {
  const key = apiKey()
  const store = await getStoreCoordinates()
  if (!key || !store) return null

  const waypoints = `${store.lat},${store.lon}|${dest.lat},${dest.lon}`
  const params = new URLSearchParams({
    waypoints,
    mode: 'drive',
    apiKey: key,
  })

  try {
    const res = await fetch(`https://api.geoapify.com/v1/routing?${params.toString()}`, {
      next: { revalidate: 0 },
    })
    if (!res.ok) {
      console.error('[geoapify] routing', res.status)
      return null
    }
    const data = (await res.json()) as {
      features?: { properties?: { time?: number } }[]
    }
    const seconds = data.features?.[0]?.properties?.time
    if (typeof seconds !== 'number') return null
    return seconds / 60
  } catch {
    return null
  }
}

export type LocalDeliveryEligibility =
  | { ok: true; eligible: boolean; minutes: number }
  | { ok: false; error: string }

/** Checks whether an address is within the local mobile-market delivery radius. */
export async function checkLocalDeliveryEligibility(
  input: AddressInput
): Promise<LocalDeliveryEligibility> {
  if (!apiKey()) {
    return { ok: false, error: 'Local delivery is temporarily unavailable.' }
  }

  const dest = await geocodeOneLine(addressToOneLine(input))
  if (!dest) {
    return { ok: false, error: 'Could not locate this address for local delivery.' }
  }

  const minutes = await getDrivingMinutes(dest)
  if (minutes === null) {
    return { ok: false, error: 'Could not calculate drive time for this address.' }
  }

  return { ok: true, eligible: minutes <= LOCAL_DELIVERY_MAX_MINUTES, minutes: Math.round(minutes) }
}
