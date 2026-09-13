export const ORDER_STATUS_FLOW = [
  'ordered',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
] as const

/**
 * Linear progression for in-store pickup orders. There is no shipping leg —
 * the order is prepared, set aside, and then collected (by the customer, a
 * friend, or a courier like Uber/DoorDash the customer sends).
 */
export const PICKUP_STATUS_FLOW = [
  'ordered',
  'processing',
  'ready_for_pickup',
  'delivered',
] as const

export type OrderStatus =
  | (typeof ORDER_STATUS_FLOW)[number]
  | 'ready_for_pickup'
  | 'cancelled'

export const ORDER_STATUSES: OrderStatus[] = [
  'ordered',
  'processing',
  'ready_for_pickup',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
]

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  ordered: 'Ordered',
  processing: 'Processing',
  ready_for_pickup: 'Ready for pickup',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export const ORDER_STATUS_ADMIN_LABEL: Record<OrderStatus, string> = {
  ordered: '🧾 Ordered',
  processing: '⚙️ Processing',
  ready_for_pickup: '🛍️ Ready for pickup',
  shipped: '📦 Shipped',
  out_for_delivery: '🚚 Out for Delivery',
  delivered: '✅ Delivered',
  cancelled: '❌ Cancelled',
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  ordered: 'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  ready_for_pickup: 'bg-teal-100 text-teal-700',
  shipped: 'bg-violet-100 text-violet-700',
  out_for_delivery: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-600',
}

const LEGACY_MAP: Record<string, OrderStatus> = {
  pending: 'ordered',
}

export function normalizeOrderStatus(input: string | null | undefined): OrderStatus {
  const key = (input ?? '').trim().toLowerCase()
  if (key in LEGACY_MAP) return LEGACY_MAP[key]
  if (
    key === 'ordered' ||
    key === 'processing' ||
    key === 'ready_for_pickup' ||
    key === 'shipped' ||
    key === 'out_for_delivery' ||
    key === 'delivered' ||
    key === 'cancelled'
  ) {
    return key
  }
  return 'ordered'
}

/** True when a shipping method string represents in-store pickup. */
export function isPickupShippingMethod(method: string | null | undefined): boolean {
  return (method ?? '').trim().toLowerCase() === 'pickup'
}

/** True when a shipping method string represents staff-driven local delivery (no carrier). */
export function isLocalDeliveryShippingMethod(method: string | null | undefined): boolean {
  return (method ?? '').trim().toLowerCase() === 'local_delivery'
}

/**
 * False for pickup and local delivery — both are fulfilled without a
 * carrier label (customer collects, or staff drives it themselves).
 */
export function requiresShippingLabel(method: string | null | undefined): boolean {
  return !isPickupShippingMethod(method) && !isLocalDeliveryShippingMethod(method)
}

/** The correct linear status flow for an order based on its shipping method. */
export function getStatusFlow(
  shippingMethod: string | null | undefined
): readonly OrderStatus[] {
  return isPickupShippingMethod(shippingMethod) ? PICKUP_STATUS_FLOW : ORDER_STATUS_FLOW
}

/** Statuses that describe a carrier leg and never apply to a pickup order. */
export const SHIPPING_ONLY_STATUSES: readonly OrderStatus[] = ['shipped', 'out_for_delivery']

export function isShippingOnlyStatus(status: OrderStatus): boolean {
  return SHIPPING_ONLY_STATUSES.includes(status)
}

/**
 * Whether a status may be applied to an order with the given shipping method.
 * Pickup orders reject carrier statuses so the history stays on the pickup path.
 */
export function isStatusAllowedFor(
  status: OrderStatus,
  shippingMethod: string | null | undefined
): boolean {
  return !(isPickupShippingMethod(shippingMethod) && isShippingOnlyStatus(status))
}

/**
 * Customer-facing label. Pickup orders reuse the `delivered` status to mean
 * "collected", so we relabel it as "Picked up" for clarity.
 */
export function orderStatusLabel(
  status: OrderStatus,
  opts?: { pickup?: boolean }
): string {
  if (opts?.pickup) {
    if (status === 'delivered') return 'Picked up'
  }
  return ORDER_STATUS_LABEL[status]
}

export function getStatusStepIndex(
  status: string | null | undefined,
  flow: readonly OrderStatus[] = ORDER_STATUS_FLOW
): number {
  const normalized = normalizeOrderStatus(status)
  if (normalized === 'cancelled') return -1
  return flow.indexOf(normalized)
}

export const ORDER_STATUS_TIMESTAMP_COLUMN: Record<OrderStatus, string> = {
  ordered: 'ordered_at',
  processing: 'processing_at',
  ready_for_pickup: 'ready_for_pickup_at',
  shipped: 'shipped_at',
  out_for_delivery: 'out_for_delivery_at',
  delivered: 'delivered_at',
  cancelled: 'cancelled_at',
}
