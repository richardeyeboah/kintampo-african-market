/**
 * Convert a numeric `order_number` to a human-friendly display string.
 *
 * Examples:
 *   formatOrderNumber(1042) -> "LQ-1042"
 *   formatOrderNumber(null) -> ""
 */
export function formatOrderNumber(n: number | string | null | undefined): string {
  if (n === null || n === undefined) return ''
  const num = typeof n === 'string' ? Number(n) : n
  if (!Number.isFinite(num) || num <= 0) return ''
  return `LQ-${Math.trunc(num)}`
}

/**
 * Parse user input (e.g. "LQ-1042", "lq1042", "1042", or a UUID) into the most
 * specific identifier the backend can look up:
 *   - { type: 'number', value: 1042 } for friendly order numbers
 *   - { type: 'uuid',   value: '7e0a…' } for raw UUIDs
 *   - null when the input isn't recognizable
 */
export function parseOrderRef(
  raw: string | null | undefined
): { type: 'number'; value: number } | { type: 'uuid'; value: string } | null {
  if (!raw) return null
  const t = raw.trim()
  if (!t) return null

  // UUID v4-ish
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t)) {
    return { type: 'uuid', value: t.toLowerCase() }
  }

  // Strip an optional "LQ-" / "LQ" / "#" prefix and any whitespace.
  const stripped = t.replace(/^#?\s*lq[-\s]?/i, '').replace(/^#/, '').trim()
  const asNumber = Number(stripped)
  if (Number.isFinite(asNumber) && Number.isInteger(asNumber) && asNumber > 0) {
    return { type: 'number', value: asNumber }
  }

  return null
}
