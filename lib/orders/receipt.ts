/**
 * Shared receipt model. One source of truth for the on-screen receipt, the
 * printable version, and the downloadable PDF, so a customer can never see
 * three different totals for the same order.
 */

import { STORE } from '@/lib/constants/store'
import { formatOrderNumber } from '@/lib/orders/order-number'
import { isPickupShippingMethod, normalizeOrderStatus, orderStatusLabel } from '@/lib/order-status'
import { SHIPPING_METHOD_LABEL, type ShippingMethod } from '@/lib/shipping'
import type { ReceiptPdfLine } from '@/lib/client/receipt-pdf'

export type ReceiptOrderInput = {
  id: string
  order_number?: number | null
  created_at?: string | null
  status?: string | null
  customer_name?: string | null
  customer_email?: string | null
  customer_phone?: string | null
  address_line?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  country?: string | null
  subtotal_amount?: number | null
  shipping_fee?: number | null
  tax_amount?: number | null
  total_amount?: number | null
  refund_amount?: number | null
  shipping_method?: string | null
  payment_method?: string | null
  pickup_contact_name?: string | null
  delivery_proof?: string | null
}

export type ReceiptItemInput = {
  id: string
  product_name?: string | null
  product_price?: number | null
  quantity?: number | null
  subtotal?: number | null
  fulfilled_quantity?: number | null
}

export type ReceiptLine = {
  id: string
  name: string
  unitPrice: number
  orderedQuantity: number
  fulfilledQuantity: number
  missingQuantity: number
  /** Charged value of the units actually supplied. */
  lineTotal: number
}

export type ReceiptModel = {
  orderLabel: string
  orderId: string
  placedAt: string | null
  statusLabel: string
  isPickup: boolean
  fulfillmentLabel: string
  customerName: string
  customerEmail: string | null
  customerPhone: string | null
  destinationLines: string[]
  lines: ReceiptLine[]
  shortLines: ReceiptLine[]
  /** Original order subtotal, before any shortage. */
  subtotal: number
  /** Value of items actually supplied. */
  fulfilledSubtotal: number
  shippingFee: number
  tax: number
  total: number
  refunded: number
  netPaid: number
  hasShortage: boolean
}

function num(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export function buildReceiptModel(
  order: ReceiptOrderInput,
  items: ReceiptItemInput[]
): ReceiptModel {
  const isPickup = isPickupShippingMethod(order.shipping_method)
  const status = normalizeOrderStatus(order.status)
  const method = (order.shipping_method as ShippingMethod | null) ?? 'standard'

  const lines: ReceiptLine[] = items.map((item) => {
    const ordered = Math.max(0, Math.trunc(num(item.quantity)))
    const recorded = item.fulfilled_quantity
    const fulfilled =
      typeof recorded === 'number' && Number.isFinite(recorded)
        ? Math.max(0, Math.min(ordered, Math.trunc(recorded)))
        : ordered
    const unitPrice = num(item.product_price)

    return {
      id: item.id,
      name: String(item.product_name ?? 'Item'),
      unitPrice,
      orderedQuantity: ordered,
      fulfilledQuantity: fulfilled,
      missingQuantity: ordered - fulfilled,
      lineTotal: round2(unitPrice * fulfilled),
    }
  })

  const destinationLines = isPickup
    ? [STORE.name, STORE.address, STORE.hours]
    : [
        order.address_line ?? '',
        [order.city, order.state].filter(Boolean).join(', ') +
          (order.postal_code ? ` ${order.postal_code}` : ''),
        order.country ?? '',
      ].filter((l) => l.trim().length > 0)

  const total = num(order.total_amount)
  const refunded = num(order.refund_amount)

  return {
    orderLabel: formatOrderNumber(order.order_number) || order.id.slice(0, 8),
    orderId: order.id,
    placedAt: order.created_at ?? null,
    statusLabel: orderStatusLabel(status, { pickup: isPickup }),
    isPickup,
    fulfillmentLabel: SHIPPING_METHOD_LABEL[method] ?? String(order.shipping_method ?? '—'),
    customerName: order.customer_name ?? '',
    customerEmail: order.customer_email ?? null,
    customerPhone: order.customer_phone ?? null,
    destinationLines,
    lines,
    shortLines: lines.filter((l) => l.missingQuantity > 0),
    subtotal: num(order.subtotal_amount),
    fulfilledSubtotal: round2(lines.reduce((sum, l) => sum + l.lineTotal, 0)),
    shippingFee: num(order.shipping_fee),
    tax: num(order.tax_amount),
    total,
    refunded,
    netPaid: round2(Math.max(0, total - refunded)),
    hasShortage: lines.some((l) => l.missingQuantity > 0),
  }
}

function money(n: number): string {
  return `$${n.toFixed(2)}`
}

/** Flat line list for the downloadable PDF. */
export function buildReceiptPdfLines(model: ReceiptModel): ReceiptPdfLine[] {
  const lines: ReceiptPdfLine[] = [
    { text: STORE.name, bold: true, size: 15 },
    { text: STORE.address, size: 9.5 },
    { text: STORE.hours, size: 9.5 },

    { text: `RECEIPT — ORDER ${model.orderLabel}`, bold: true, size: 20, spaceBefore: 18 },
    {
      text: model.placedAt ? `Placed ${new Date(model.placedAt).toLocaleString()}` : '',
      size: 9.5,
    },
    { text: `Status: ${model.statusLabel}`, size: 9.5 },
    { text: `Fulfillment: ${model.fulfillmentLabel}`, size: 9.5 },

    { text: 'CUSTOMER', bold: true, size: 10, spaceBefore: 16 },
    { text: model.customerName },
  ]

  if (model.customerEmail) lines.push({ text: model.customerEmail })
  if (model.customerPhone) lines.push({ text: model.customerPhone })

  lines.push({
    text: model.isPickup ? 'PICK UP AT' : 'DELIVER TO',
    bold: true,
    size: 10,
    spaceBefore: 16,
  })
  for (const line of model.destinationLines) lines.push({ text: line })

  lines.push({ text: 'ITEMS', bold: true, size: 10, spaceBefore: 16 })
  for (const line of model.lines) {
    const qty =
      line.missingQuantity > 0
        ? `${line.fulfilledQuantity} of ${line.orderedQuantity} (${line.missingQuantity} unavailable)`
        : `x${line.fulfilledQuantity}`
    lines.push({ text: `${line.name}  ${qty}  ${money(line.lineTotal)}` })
  }

  lines.push({ text: 'TOTALS', bold: true, size: 10, spaceBefore: 16 })
  lines.push({ text: `Subtotal: ${money(model.subtotal)}` })
  if (model.hasShortage) {
    lines.push({ text: `Items supplied: ${money(model.fulfilledSubtotal)}` })
  }
  lines.push({
    text: `${model.isPickup ? 'Pickup fee' : 'Shipping'}: ${
      model.isPickup && model.shippingFee === 0 ? '—' : money(model.shippingFee)
    }`,
  })
  if (model.tax > 0) lines.push({ text: `Sales tax: ${money(model.tax)}` })
  lines.push({ text: `Order total: ${money(model.total)}`, bold: true })
  if (model.refunded > 0) {
    lines.push({ text: `Refunded: -${money(model.refunded)}` })
    lines.push({ text: `Net paid: ${money(model.netPaid)}`, bold: true })
  }

  if (model.isPickup) {
    lines.push({
      text: `Show order ${model.orderLabel} at the counter to collect. Anyone you send — a friend or a delivery driver — can present this receipt.`,
      size: 9.5,
      spaceBefore: 16,
    })
  }

  return lines.filter((l) => l.text.trim().length > 0 || (l.spaceBefore ?? 0) > 0)
}

export function receiptFileName(model: ReceiptModel): string {
  return `receipt-${model.orderLabel}.pdf`
}
