import { DateTime } from 'luxon'
import { getReportTimeZone } from '@/lib/admin/revenue-stats'

export type RangeKey =
  | 'today'
  | 'yesterday'
  | '7d'
  | '30d'
  | 'wtd'
  | 'mtd'
  | 'last_week'
  | 'last_month'
  | 'ytd'
  | 'all'
  | 'custom'

export type ResolvedRange = {
  key: RangeKey
  label: string
  /** Inclusive start (set to 00:00 in the reporting TZ). May be null for 'all'. */
  start: DateTime | null
  /** Exclusive end (one tick past the last second in the period). */
  end: DateTime
  /** Same shape but for the previous equivalent period — used for deltas. */
  prevStart: DateTime | null
  prevEnd: DateTime | null
  /** Human-readable like "Sep 1 – Sep 7" for display. */
  formattedRange: string
}

export const RANGE_OPTIONS: Array<{ id: RangeKey; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: 'wtd', label: 'Week to date' },
  { id: 'mtd', label: 'Month to date' },
  { id: 'last_week', label: 'Last week' },
  { id: 'last_month', label: 'Last month' },
  { id: 'ytd', label: 'Year to date' },
  { id: 'all', label: 'All time' },
  { id: 'custom', label: 'Custom' },
]

function fmt(d: DateTime): string {
  return d.toFormat('LLL d')
}

function fmtRange(a: DateTime | null, b: DateTime): string {
  if (!a) return `up to ${b.toFormat('LLL d, yyyy')}`
  if (a.hasSame(b.minus({ seconds: 1 }), 'day')) {
    return a.toFormat('LLL d, yyyy')
  }
  const sameYear = a.year === b.year
  const left = sameYear ? fmt(a) : a.toFormat('LLL d, yyyy')
  const right = b.minus({ seconds: 1 }).toFormat(sameYear ? 'LLL d, yyyy' : 'LLL d, yyyy')
  return `${left} – ${right}`
}

/**
 * Resolve a range key (and optional from/to dates) into concrete period
 * boundaries in the store's reporting timezone. For custom ranges the
 * caller passes `from` / `to` as yyyy-MM-dd strings.
 *
 * The "previous equivalent period" boundaries always have the same length
 * as the main period and immediately precede it, so we can compute a fair
 * "% vs. previous" delta for every KPI.
 */
export function resolveRange(
  key: RangeKey | undefined,
  from: string | undefined,
  to: string | undefined
): ResolvedRange {
  const zone = getReportTimeZone()
  const now = DateTime.now().setZone(zone)
  const todayStart = now.startOf('day')
  const tomorrowStart = todayStart.plus({ days: 1 })

  let start: DateTime | null = todayStart
  let end: DateTime = tomorrowStart
  let label = 'Today'
  let resolvedKey: RangeKey = key ?? 'today'

  switch (resolvedKey) {
    case 'today':
      start = todayStart
      end = tomorrowStart
      label = 'Today'
      break
    case 'yesterday':
      start = todayStart.minus({ days: 1 })
      end = todayStart
      label = 'Yesterday'
      break
    case '7d':
      start = todayStart.minus({ days: 6 })
      end = tomorrowStart
      label = 'Last 7 days'
      break
    case '30d':
      start = todayStart.minus({ days: 29 })
      end = tomorrowStart
      label = 'Last 30 days'
      break
    case 'wtd':
      start = now.startOf('week')
      end = tomorrowStart
      label = 'Week to date'
      break
    case 'mtd':
      start = now.startOf('month')
      end = tomorrowStart
      label = 'Month to date'
      break
    case 'last_week':
      start = now.minus({ weeks: 1 }).startOf('week')
      end = now.startOf('week')
      label = 'Last week'
      break
    case 'last_month':
      start = now.minus({ months: 1 }).startOf('month')
      end = now.startOf('month')
      label = 'Last month'
      break
    case 'ytd':
      start = now.startOf('year')
      end = tomorrowStart
      label = 'Year to date'
      break
    case 'all':
      start = null
      end = tomorrowStart
      label = 'All time'
      break
    case 'custom': {
      const f = (from ?? '').trim()
      const t = (to ?? '').trim()
      const fd = f ? DateTime.fromISO(f, { zone }) : null
      const td = t ? DateTime.fromISO(t, { zone }) : null
      start = fd?.isValid ? fd.startOf('day') : todayStart
      end = td?.isValid ? td.endOf('day').plus({ milliseconds: 1 }) : tomorrowStart
      if (end <= start!) end = start!.plus({ days: 1 })
      label = 'Custom'
      break
    }
    default:
      resolvedKey = 'today'
  }

  let prevStart: DateTime | null = null
  let prevEnd: DateTime | null = null
  if (start) {
    const lengthMs = end.toMillis() - start.toMillis()
    prevEnd = start
    prevStart = start.minus({ milliseconds: lengthMs })
  }

  return {
    key: resolvedKey,
    label,
    start,
    end,
    prevStart,
    prevEnd,
    formattedRange: fmtRange(start, end),
  }
}

export function deltaPct(current: number, previous: number): number | null {
  if (!previous || previous === 0) return null
  return ((current - previous) / previous) * 100
}
