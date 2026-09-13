import { normalizeOrderStatus } from '@/lib/order-status'

export type PeriodOrderRow = {
  id: string
  total_amount: number | string | null
  subtotal_amount?: number | string | null
  shipping_fee?: number | string | null
  status: string | null
  refunded_at: string | null
  refund_amount: number | string | null
  created_at: string
  /** 'paid' | 'unpaid' — missing on installs without the phone-orders migration. */
  payment_status?: string | null
}

export type PeriodOrderItem = {
  order_id: string
  product_id: string | null
  product_name: string
  quantity: number | string | null
  subtotal: number | string | null
  product_price?: number | string | null
}

export type PeriodStats = {
  gross: number
  netRevenue: number
  refundsTotal: number
  refundsCount: number
  ordersCount: number
  unitsSold: number
  averageOrderValue: number
  cancelledCount: number
  /** Phone/in-store orders not yet paid — excluded from gross. */
  unpaidCount: number
  unpaidTotal: number
}

function num(n: number | string | null | undefined): number {
  const v = Number(n ?? 0)
  return Number.isFinite(v) ? v : 0
}

/**
 * Pure aggregation for a list of orders + their items.
 * - gross         = sum(total_amount) of orders that aren't cancelled / refunded
 * - netRevenue    = gross - refundsTotal (full + partial)
 * - ordersCount   = orders that count toward gross
 * - unitsSold     = sum(quantity) across items belonging to those orders
 * - aov           = gross / ordersCount (0 if no orders)
 */
export function computePeriodStats(
  orders: PeriodOrderRow[],
  items: PeriodOrderItem[]
): PeriodStats {
  let gross = 0
  let refundsTotal = 0
  let refundsCount = 0
  let cancelledCount = 0
  let ordersCount = 0
  let unpaidCount = 0
  let unpaidTotal = 0
  const countableOrderIds = new Set<string>()

  for (const o of orders) {
    const st = normalizeOrderStatus(o.status)
    if (st === 'cancelled') {
      cancelledCount += 1
      continue
    }
    if (o.refunded_at) {
      refundsCount += 1
      refundsTotal += num(o.refund_amount) || num(o.total_amount)
      continue
    }
    if (o.payment_status === 'unpaid') {
      unpaidCount += 1
      unpaidTotal += num(o.total_amount)
      continue
    }
    gross += num(o.total_amount)
    ordersCount += 1
    countableOrderIds.add(o.id)
  }

  let unitsSold = 0
  for (const it of items) {
    if (!countableOrderIds.has(it.order_id)) continue
    unitsSold += num(it.quantity)
  }

  const netRevenue = gross - refundsTotal
  const averageOrderValue = ordersCount > 0 ? gross / ordersCount : 0

  return {
    gross,
    netRevenue,
    refundsTotal,
    refundsCount,
    ordersCount,
    unitsSold,
    averageOrderValue,
    cancelledCount,
    unpaidCount,
    unpaidTotal,
  }
}

export type BestSellerRow = {
  productId: string | null
  productName: string
  units: number
  revenue: number
}

/** Top products by units sold within a set of "countable" order IDs. */
export function topProducts(
  items: PeriodOrderItem[],
  countableOrderIds: Set<string>,
  limit: number = 10
): BestSellerRow[] {
  const acc = new Map<string, BestSellerRow>()
  for (const it of items) {
    if (!countableOrderIds.has(it.order_id)) continue
    const key = it.product_id ?? it.product_name
    const e = acc.get(key) ?? {
      productId: it.product_id,
      productName: it.product_name,
      units: 0,
      revenue: 0,
    }
    e.units += num(it.quantity)
    e.revenue += num(it.subtotal)
    acc.set(key, e)
  }
  return [...acc.values()]
    .sort((a, b) => b.units - a.units || b.revenue - a.revenue)
    .slice(0, limit)
}

/** Helper to pull "countable" order ids (paid + not refunded + not cancelled) */
export function countableOrderIdsFrom(orders: PeriodOrderRow[]): Set<string> {
  const set = new Set<string>()
  for (const o of orders) {
    const st = normalizeOrderStatus(o.status)
    if (st === 'cancelled') continue
    if (o.refunded_at) continue
    if (o.payment_status === 'unpaid') continue
    set.add(o.id)
  }
  return set
}
