import { sendOrderStatusEmail } from '@/lib/email/send-order-emails'
import {
  isPickupShippingMethod,
  normalizeOrderStatus,
  ORDER_STATUS_TIMESTAMP_COLUMN,
  type OrderStatus,
} from '@/lib/order-status'
import { parseOrderRef } from '@/lib/orders/order-number'
import { supabaseAdmin } from '@/lib/supabase-admin'

const FORWARD_FLOW: OrderStatus[] = [
  'ordered',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
]

export type ShippoTrackPayload = {
  event?: string
  test?: boolean
  data?: {
    tracking_number?: string
    carrier?: string
    metadata?: string | null
    tracking_status?:
      | string
      | {
          status?: string
          status_details?: string | null
          substatus?: { code?: string | null; text?: string | null } | null
        }
      | null
  }
}

function normalizeTracking(raw: string): string {
  return raw.replace(/\s+/g, '').toUpperCase()
}

function extractShippoStatus(data: NonNullable<ShippoTrackPayload['data']>): {
  status: string
  substatus: string
  details: string
} {
  const ts = data.tracking_status
  if (typeof ts === 'string') {
    return { status: ts.toUpperCase(), substatus: '', details: '' }
  }
  if (ts && typeof ts === 'object') {
    return {
      status: String(ts.status ?? '').toUpperCase(),
      substatus: String(ts.substatus?.code ?? '').toLowerCase(),
      details: String(ts.status_details ?? ts.substatus?.text ?? '').trim(),
    }
  }
  return { status: '', substatus: '', details: '' }
}

/**
 * Map Shippo carrier tracking → our order statuses.
 * Returns null when we should not auto-change the order (UNKNOWN / FAILURE / RETURNED).
 */
export function mapShippoTrackingToOrderStatus(
  shippoStatus: string,
  substatusCode = ''
): OrderStatus | null {
  const status = shippoStatus.toUpperCase()
  const sub = substatusCode.toLowerCase()

  if (status === 'DELIVERED') return 'delivered'
  if (
    status === 'TRANSIT' &&
    (sub === 'out_for_delivery' || sub.includes('out_for_delivery'))
  ) {
    return 'out_for_delivery'
  }
  if (status === 'TRANSIT' || status === 'PRE_TRANSIT') return 'shipped'
  return null
}

function canAdvance(from: OrderStatus, to: OrderStatus): boolean {
  if (from === 'cancelled') return false
  if (from === to) return false
  const fromIdx = FORWARD_FLOW.indexOf(from)
  const toIdx = FORWARD_FLOW.indexOf(to)
  if (fromIdx < 0 || toIdx < 0) return false
  return toIdx > fromIdx
}

async function findOrderByTracking(trackingNumber: string) {
  const raw = trackingNumber.trim()
  const compact = normalizeTracking(raw)

  const { data: exact } = await supabaseAdmin
    .from('orders')
    .select(
      'id, status, order_number, customer_name, customer_email, total_amount, shipping_method, tracking_number'
    )
    .eq('tracking_number', raw)
    .maybeSingle()

  if (exact) return exact

  if (compact !== raw) {
    const { data: spaced } = await supabaseAdmin
      .from('orders')
      .select(
        'id, status, order_number, customer_name, customer_email, total_amount, shipping_method, tracking_number'
      )
      .eq('tracking_number', compact)
      .maybeSingle()
    if (spaced) return spaced
  }

  // Fallback: scan recent tracked orders (normalized compare) — rare mismatch path
  const { data: recent } = await supabaseAdmin
    .from('orders')
    .select(
      'id, status, order_number, customer_name, customer_email, total_amount, shipping_method, tracking_number'
    )
    .not('tracking_number', 'is', null)
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    (recent ?? []).find(
      (o) =>
        typeof o.tracking_number === 'string' &&
        normalizeTracking(o.tracking_number) === compact
    ) ?? null
  )
}

async function findOrderByMetadata(metadata: string | null | undefined) {
  if (!metadata?.trim()) return null
  const parsed = parseOrderRef(metadata)
  if (!parsed) return null

  if (parsed.type === 'uuid') {
    const { data } = await supabaseAdmin
      .from('orders')
      .select(
        'id, status, order_number, customer_name, customer_email, total_amount, shipping_method, tracking_number'
      )
      .eq('id', parsed.value)
      .maybeSingle()
    return data
  }

  const { data } = await supabaseAdmin
    .from('orders')
    .select(
      'id, status, order_number, customer_name, customer_email, total_amount, shipping_method, tracking_number'
    )
    .eq('order_number', parsed.value)
    .maybeSingle()
  return data
}

export async function applyShippoTrackingUpdate(payload: ShippoTrackPayload): Promise<{
  ok: boolean
  updated?: boolean
  orderId?: string
  toStatus?: OrderStatus
  reason?: string
}> {
  const event = String(payload.event ?? '').toLowerCase()
  if (event && event !== 'track_updated') {
    return { ok: true, updated: false, reason: `ignored event ${event}` }
  }

  const data = payload.data
  if (!data) {
    return { ok: true, updated: false, reason: 'missing data' }
  }

  const trackingNumber = String(data.tracking_number ?? '').trim()
  const { status: shippoStatus, substatus, details } = extractShippoStatus(data)
  const target = mapShippoTrackingToOrderStatus(shippoStatus, substatus)

  if (!target) {
    return {
      ok: true,
      updated: false,
      reason: `no mapping for ${shippoStatus || 'empty'}${substatus ? `/${substatus}` : ''}`,
    }
  }

  const order =
    (trackingNumber ? await findOrderByTracking(trackingNumber) : null) ??
    (await findOrderByMetadata(data.metadata))

  if (!order) {
    return {
      ok: true,
      updated: false,
      reason: trackingNumber ? `no order for tracking ${trackingNumber}` : 'no tracking number',
    }
  }

  if (isPickupShippingMethod(order.shipping_method)) {
    return { ok: true, updated: false, orderId: order.id, reason: 'pickup order' }
  }

  const fromStatus = normalizeOrderStatus(order.status)
  if (!canAdvance(fromStatus, target)) {
    return {
      ok: true,
      updated: false,
      orderId: order.id,
      reason: `no advance ${fromStatus} → ${target}`,
    }
  }

  const nowIso = new Date().toISOString()
  const updatePayload: Record<string, unknown> = {
    status: target,
  }
  updatePayload[ORDER_STATUS_TIMESTAMP_COLUMN[target]] = nowIso
  if (trackingNumber && !order.tracking_number) {
    updatePayload.tracking_number = trackingNumber
  }
  if (data.carrier) {
    updatePayload.shipping_carrier = String(data.carrier).toUpperCase()
  }

  let updateResult = await supabaseAdmin
    .from('orders')
    .update(updatePayload)
    .eq('id', order.id)
    .select('id')
    .single()

  if (
    updateResult.error &&
    (/column .* does not exist/i.test(updateResult.error.message) ||
      /could not find the .* column/i.test(updateResult.error.message))
  ) {
    updateResult = await supabaseAdmin
      .from('orders')
      .update({ status: target })
      .eq('id', order.id)
      .select('id')
      .single()
  }

  if (updateResult.error) {
    return { ok: false, orderId: order.id, reason: updateResult.error.message }
  }

  const noteParts = [
    `Shippo tracking: ${shippoStatus}`,
    substatus ? `(${substatus})` : '',
    trackingNumber ? `· ${trackingNumber}` : '',
    details ? `· ${details}` : '',
  ].filter(Boolean)

  await supabaseAdmin.from('order_status_logs').insert({
    order_id: order.id,
    from_status: fromStatus,
    to_status: target,
    changed_by: 'shippo_webhook',
    note: noteParts.join(' ').trim(),
  })

  if (order.customer_email) {
    try {
      await sendOrderStatusEmail(
        {
          id: order.id,
          order_number: order.order_number ?? null,
          customer_name: order.customer_name ?? 'there',
          customer_email: order.customer_email,
          total_amount: Number(order.total_amount ?? 0),
          tracking_number: trackingNumber || order.tracking_number || null,
          shipping_method: order.shipping_method ?? null,
        },
        target,
        details || null
      )
    } catch (e) {
      console.error('[shippo] status email failed:', e)
    }
  }

  return { ok: true, updated: true, orderId: order.id, toStatus: target }
}
