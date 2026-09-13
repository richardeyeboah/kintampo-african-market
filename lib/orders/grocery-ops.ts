/** Grocery ops defaults — Tier 2 checkout + stock. */

export { LOCAL_DELIVERY_MIN_SUBTOTAL } from '@/lib/shipping'

export const LOW_STOCK_THRESHOLD = 5

export type SubstitutionPref = 'refund' | 'call' | 'substitute'

export const SUBSTITUTION_OPTIONS: Array<{
  value: SubstitutionPref
  label: string
  hint: string
}> = [
  {
    value: 'refund',
    label: 'Refund missing items',
    hint: 'Charge only what we hand over',
  },
  {
    value: 'call',
    label: 'Call me first',
    hint: 'We text or call before substituting',
  },
  {
    value: 'substitute',
    label: 'Substitute similar',
    hint: 'Same category / brand when possible',
  },
]

export function normalizeSubstitutionPref(raw: unknown): SubstitutionPref {
  if (raw === 'call' || raw === 'substitute' || raw === 'refund') return raw
  return 'refund'
}

export type PickupSlotId =
  | 'today_asap'
  | 'today_afternoon'
  | 'tomorrow_morning'
  | 'tomorrow_afternoon'

export const PICKUP_SLOT_OPTIONS: Array<{
  value: PickupSlotId
  label: string
  hint: string
}> = [
  { value: 'today_asap', label: 'Today — ASAP', hint: 'We stage as soon as ready' },
  { value: 'today_afternoon', label: 'Today — after 3pm', hint: 'Afternoon pickup window' },
  { value: 'tomorrow_morning', label: 'Tomorrow — morning', hint: 'Before noon' },
  { value: 'tomorrow_afternoon', label: 'Tomorrow — afternoon', hint: 'After 3pm' },
]

export function normalizePickupSlot(raw: unknown): PickupSlotId | null {
  if (
    raw === 'today_asap' ||
    raw === 'today_afternoon' ||
    raw === 'tomorrow_morning' ||
    raw === 'tomorrow_afternoon'
  ) {
    return raw
  }
  return null
}

export function pickupSlotLabel(id: string | null | undefined): string {
  const hit = PICKUP_SLOT_OPTIONS.find((o) => o.value === id)
  return hit?.label ?? (id?.trim() || '—')
}

/** Preset tip amounts in dollars; 0 = no tip. */
export const TIP_PRESETS = [0, 2, 3, 5] as const

export function clampTip(amount: unknown): number {
  const n = Number(amount)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.round(Math.min(n, 100) * 100) / 100
}

export const DIETARY_TAGS = [
  'vegetarian',
  'vegan',
  'gluten_free',
  'halal',
  'spicy',
] as const

export type DietaryTag = (typeof DIETARY_TAGS)[number]

export const DIETARY_TAG_LABEL: Record<DietaryTag, string> = {
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  gluten_free: 'Gluten free',
  halal: 'Halal',
  spicy: 'Spicy',
}

export function normalizeDietaryTag(raw: string): DietaryTag | null {
  const key = raw.trim().toLowerCase().replace(/\s+/g, '_')
  return (DIETARY_TAGS as readonly string[]).includes(key) ? (key as DietaryTag) : null
}
