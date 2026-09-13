import { DateTime } from 'luxon'
import { normalizeOrderStatus } from '@/lib/order-status'

/** Orders placed with paid fulfilment intent — excludes cancelled and refunded rows. */
export type OrderMoneyRow = {
  total_amount: number | string | null
  created_at: string
  status: string | null
  refunded_at?: string | null
  /** 'paid' | 'unpaid' — missing on installs without the phone-orders migration. */
  payment_status?: string | null
}

export function getReportTimeZone(): string {
  const raw = process.env.STORE_REPORT_TIMEZONE?.trim()
  if (raw && DateTime.now().setZone(raw).isValid) return raw
  return 'America/New_York'
}

/** Human label for dashboards (store is in Columbus, OH — Eastern Time). */
export function getReportTimeZoneLabel(): string {
  const custom = process.env.STORE_REPORT_TIMEZONE_LABEL?.trim()
  if (custom) return custom
  const zone = getReportTimeZone()
  if (zone === 'America/New_York') return 'Columbus, OH · Eastern Time'
  return zone.replace(/_/g, ' ')
}

export function isCountableForGross(o: OrderMoneyRow): boolean {
  const st = normalizeOrderStatus(o.status)
  if (st === 'cancelled') return false
  if (o.refunded_at) return false
  if (o.payment_status === 'unpaid') return false
  return true
}

export type RevenueSnapshot = {
  timeZone: string
  /** yyyy-MM-dd in reporting TZ */
  todayKey: string
  /** Gross revenue for calendar day (paid orders only; excludes cancelled / refunded). */
  todayGross: number
  yesterdayGross: number
  trailing7Gross: number
  trailing30Gross: number
  monthToDateGross: number
  /** Previous complete calendar month gross (same TZ). */
  priorCalendarMonthGross: number
  /** Same-month-day comparison: MTD vs equivalent slice of prior month (through same calendar day). */
  priorMonthPartialThroughSameDayGross: number
  orderCountTrailing30: number
  /** Gross ÷ order count, trailing 30 days */
  averageOrderValueTrailing30: number
  /** Trailing-30 gross ÷ 30 */
  averageDailyGrossTrailing30: number
}

/**
 * Aggregates order totals using calendar boundaries in `STORE_REPORT_TIMEZONE`
 * (default America/New_York). Intended for internal ops dashboards — not GAAP.
 *
 * Assumes `created_at` is stored as ISO timestamptz from Supabase.
 */
export function computeRevenueSnapshot(rows: OrderMoneyRow[]): RevenueSnapshot {
  const zone = getReportTimeZone()
  const now = DateTime.now().setZone(zone)
  const todayKey = now.toFormat('yyyy-MM-dd')

  const countable = rows.filter(isCountableForGross)

  const byDay = new Map<string, number>()
  for (const r of countable) {
    const dt = DateTime.fromISO(r.created_at, { zone: 'utc' }).setZone(zone)
    if (!dt.isValid) continue
    const key = dt.toFormat('yyyy-MM-dd')
    const amt = Number(r.total_amount ?? 0)
    if (!Number.isFinite(amt)) continue
    byDay.set(key, (byDay.get(key) ?? 0) + amt)
  }

  const todayGross = byDay.get(todayKey) ?? 0

  const yesterdayKey = now.minus({ days: 1 }).toFormat('yyyy-MM-dd')
  const yesterdayGross = byDay.get(yesterdayKey) ?? 0

  let trailing7Gross = 0
  for (let i = 0; i < 7; i++) {
    trailing7Gross += byDay.get(now.minus({ days: i }).toFormat('yyyy-MM-dd')) ?? 0
  }

  let trailing30Gross = 0
  for (let i = 0; i < 30; i++) {
    trailing30Gross += byDay.get(now.minus({ days: i }).toFormat('yyyy-MM-dd')) ?? 0
  }

  const trailing30WindowStart = now.minus({ days: 29 }).startOf('day')

  let monthToDateGross = 0
  const monthStart = now.startOf('month').startOf('day')
  let cursor = monthStart
  const todayEnd = now.endOf('day')
  while (cursor <= todayEnd) {
    monthToDateGross += byDay.get(cursor.toFormat('yyyy-MM-dd')) ?? 0
    cursor = cursor.plus({ days: 1 })
  }

  const prevMonthStart = now.minus({ months: 1 }).startOf('month').startOf('day')
  const prevMonthEnd = now.minus({ months: 1 }).endOf('month').endOf('day')
  let priorCalendarMonthGross = 0
  cursor = prevMonthStart
  while (cursor <= prevMonthEnd) {
    priorCalendarMonthGross += byDay.get(cursor.toFormat('yyyy-MM-dd')) ?? 0
    cursor = cursor.plus({ days: 1 })
  }

  /** Compare MTD to “same number of elapsed days” last month (fair MoM pace). */
  const dayOfMonth = now.day
  let priorMonthPartialThroughSameDayGross = 0
  cursor = prevMonthStart
  let counted = 0
  while (counted < dayOfMonth && cursor <= prevMonthEnd) {
    priorMonthPartialThroughSameDayGross += byDay.get(cursor.toFormat('yyyy-MM-dd')) ?? 0
    cursor = cursor.plus({ days: 1 })
    counted++
  }

  const orderCountTrailing30 = countable.filter((r) => {
    const dt = DateTime.fromISO(r.created_at, { zone: 'utc' }).setZone(zone)
    return dt.isValid && dt >= trailing30WindowStart
  }).length

  const averageOrderValueTrailing30 =
    orderCountTrailing30 > 0 ? trailing30Gross / orderCountTrailing30 : 0
  const averageDailyGrossTrailing30 = trailing30Gross / 30

  return {
    timeZone: zone,
    todayKey,
    todayGross,
    yesterdayGross,
    trailing7Gross,
    trailing30Gross,
    monthToDateGross,
    priorCalendarMonthGross,
    priorMonthPartialThroughSameDayGross,
    orderCountTrailing30,
    averageOrderValueTrailing30,
    averageDailyGrossTrailing30,
  }
}

export function money(n: number): string {
  return `$${n.toFixed(2)}`
}
