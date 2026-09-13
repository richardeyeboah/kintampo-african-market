export type ShippingMethod = 'standard' | 'express' | 'pickup' | 'local_delivery'

export type ShippingQuoteInput = {
  subtotal: number
  country?: string
  state?: string
  method?: string
}

export type ShippingQuote = {
  method: ShippingMethod
  fee: number
  zone: 'local' | 'regional' | 'national' | 'international' | 'pickup'
  label: string
}

// ---------------------------------------------------------------------------
// USPS Ground Advantage zones from Columbus, OH (43229)
// Rates based on Shippo commercial pricing for a ~2 lb, 12×8×6 in package
// Zone 1-2 = nearest, Zone 8 = farthest (AK/HI)
// ---------------------------------------------------------------------------

const STATE_ZONE: Record<string, number> = {
  // Zone 2 — Ohio + immediate neighbors (~$6.00)
  OH: 2, IN: 2, KY: 2, MI: 2, WV: 2,

  // Zone 3 — Mid-Atlantic + Great Lakes (~$7.00)
  PA: 3, TN: 3, VA: 3, MD: 3, DC: 3, DE: 3, NJ: 3, NY: 3,
  IL: 3, WI: 3,

  // Zone 4 — South + Upper Midwest (~$7.99)
  NC: 4, SC: 4, GA: 4, AL: 4, MN: 4, IA: 4, MO: 4, AR: 4,
  CT: 4, RI: 4, MA: 4, VT: 4, NH: 4, ME: 4,

  // Zone 5 — Deep South + Plains (~$8.99)
  FL: 5, MS: 5, LA: 5, NE: 5, SD: 5, ND: 5, KS: 5, OK: 5,

  // Zone 6 — West + Mountain (~$9.99)
  TX: 6, CO: 6, WY: 6, MT: 6, ID: 6, UT: 6, NV: 6, NM: 6, AZ: 6,

  // Zone 7 — Pacific Coast (~$11.49)
  CA: 7, OR: 7, WA: 7,

  // Zone 8 — Alaska, Hawaii, Puerto Rico (~$16.99)
  AK: 8, HI: 8, PR: 8, GU: 8, VI: 8,
}

// Shipping rates per zone for standard USPS Ground Advantage (Shippo commercial)
// Based on 12×8×6 in box, ~2 lb from Columbus OH
const ZONE_RATE: Record<number, number> = {
  2: 9.99,   // Ohio + neighbors
  3: 9.99,   // Mid-Atlantic, Great Lakes
  4: 9.99,   // South, Upper Midwest, New England
  5: 9.99,   // Deep South, Plains
  6: 10.99,  // West, Mountain
  7: 13.49,  // Pacific Coast
  8: 19.99,  // AK, HI, PR
}

const COUNTRY_ALIASES: Record<string, string> = {
  us: 'united states',
  usa: 'united states',
  'u s a': 'united states',
  'u s': 'united states',
  america: 'united states',
  'united states of america': 'united states',
  canada: 'canada',
}

// State name → abbreviation for lookup
const STATE_NAME_TO_CODE: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR',
  california: 'CA', colorado: 'CO', connecticut: 'CT', delaware: 'DE',
  'district of columbia': 'DC', florida: 'FL', georgia: 'GA', hawaii: 'HI',
  idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA', kansas: 'KS',
  kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS',
  missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM',
  'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND',
  ohio: 'OH', oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA',
  'rhode island': 'RI', 'south carolina': 'SC', 'south dakota': 'SD',
  tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT',
  virginia: 'VA', washington: 'WA', 'west virginia': 'WV',
  wisconsin: 'WI', wyoming: 'WY', 'puerto rico': 'PR', guam: 'GU',
}

export const SHIPPING_METHOD_LABEL: Record<ShippingMethod, string> = {
  standard: 'Standard Delivery',
  express: 'Express Delivery',
  pickup: 'Store Pickup',
  local_delivery: 'Local Delivery',
}

/** Flat fee for local mobile-market delivery within the drive-time radius. */
export const LOCAL_DELIVERY_FEE = 5

/** Minimum merchandise subtotal before local delivery is offered. */
export const LOCAL_DELIVERY_MIN_SUBTOTAL = 25

/** Subtotal for free standard US shipping at checkout */
export const FREE_STANDARD_SHIPPING_SUBTOTAL = 120

export function freeStandardShippingRemaining(subtotal: number): number {
  const safe = Number.isFinite(subtotal) ? Math.max(0, subtotal) : 0
  return Math.max(0, FREE_STANDARD_SHIPPING_SUBTOTAL - safe)
}

export function freeStandardShippingProgress(subtotal: number): number {
  const safe = Number.isFinite(subtotal) ? Math.max(0, subtotal) : 0
  return Math.min(100, (safe / FREE_STANDARD_SHIPPING_SUBTOTAL) * 100)
}

export function normalizeShippingMethod(value: string | null | undefined): ShippingMethod {
  if (
    value === 'express' ||
    value === 'pickup' ||
    value === 'standard' ||
    value === 'local_delivery'
  ) {
    return value
  }
  return 'standard'
}

function normalizeToken(value: string | null | undefined) {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[.,]/g, ' ')
    .replace(/\s+/g, ' ')
}

export function normalizeShippingCountry(value: string | null | undefined) {
  const normalized = normalizeToken(value)
  return COUNTRY_ALIASES[normalized] ?? normalized
}

export function normalizeShippingRegion(value: string | null | undefined) {
  const raw = normalizeToken(value)
    .replace(/\b(state|province|region|territory|county)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  // Try full name first, then return as-is (could be abbreviation)
  return STATE_NAME_TO_CODE[raw] ?? raw.toUpperCase()
}

function getZoneRate(stateCode: string): number {
  const code = stateCode.toUpperCase()
  // Unknown state defaults to zone 6 (West/Mountain) — US only
  const zone = STATE_ZONE[code] ?? 6
  return ZONE_RATE[zone] ?? 9.99
}

function getZoneLabel(stateCode: string): ShippingQuote['zone'] {
  const code = stateCode.toUpperCase()
  const zone = STATE_ZONE[code] ?? 6
  if (zone <= 2) return 'local'
  if (zone <= 3) return 'regional'
  return 'national'
}

export function calculateShipping(input: ShippingQuoteInput): ShippingQuote {
  const subtotal = Number.isFinite(input.subtotal) ? Math.max(0, input.subtotal) : 0
  const method = normalizeShippingMethod(input.method)
  const country = normalizeShippingCountry(input.country)
  const stateCode = normalizeShippingRegion(input.state)

  if (method === 'pickup') {
    return { method, fee: 0, zone: 'pickup', label: SHIPPING_METHOD_LABEL[method] }
  }

  if (method === 'local_delivery') {
    return { method, fee: LOCAL_DELIVERY_FEE, zone: 'local', label: SHIPPING_METHOD_LABEL[method] }
  }

  const isUnitedStates = !country || country === 'united states'

  if (!isUnitedStates) {
    return { method, fee: 34, zone: 'international', label: SHIPPING_METHOD_LABEL[method] ?? 'International Shipping' }
  }

  // Free standard shipping threshold
  if (subtotal >= FREE_STANDARD_SHIPPING_SUBTOTAL) {
    return { method, fee: 0, zone: getZoneLabel(stateCode), label: SHIPPING_METHOD_LABEL[method] ?? 'Standard Delivery' }
  }

  const zone = getZoneLabel(stateCode)

  return {
    method,
    fee: getZoneRate(stateCode),
    zone,
    label: SHIPPING_METHOD_LABEL[method] ?? 'Standard Delivery',
  }
}
