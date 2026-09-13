import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/require-admin-api'
import { assertSameOrigin } from '@/lib/security/same-origin'
import { createPhoneOrder } from '@/lib/orders/create-phone-order'
import { normalizeOrderSource, normalizePaymentStatus } from '@/lib/orders/order-source'
import { normalizeManualSettleMethod } from '@/lib/payment-methods'
import { normalizeShippingMethod } from '@/lib/shipping'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const originCheck = assertSameOrigin(req)
  if (!originCheck.ok) return originCheck.response

  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 })
  }

  const linesRaw = Array.isArray(body.lines) ? body.lines : []
  const lines = linesRaw
    .map((line: unknown) => {
      if (!line || typeof line !== 'object') return null
      const row = line as Record<string, unknown>
      return {
        productId: typeof row.productId === 'string' ? row.productId : '',
        quantity: Number(row.quantity),
      }
    })
    .filter((l: { productId: string; quantity: number } | null): l is { productId: string; quantity: number } =>
      Boolean(l)
    )

  const result = await createPhoneOrder({
    customerName: typeof body.customerName === 'string' ? body.customerName : '',
    customerPhone: typeof body.customerPhone === 'string' ? body.customerPhone : '',
    customerEmail: typeof body.customerEmail === 'string' ? body.customerEmail : null,
    source: normalizeOrderSource(body.source),
    shippingMethod: normalizeShippingMethod(
      typeof body.shippingMethod === 'string' ? body.shippingMethod : 'pickup'
    ),
    paymentStatus: normalizePaymentStatus(body.paymentStatus),
    paymentMethod: normalizeManualSettleMethod(body.paymentMethod),
    addressLine: typeof body.addressLine === 'string' ? body.addressLine : null,
    city: typeof body.city === 'string' ? body.city : null,
    state: typeof body.state === 'string' ? body.state : null,
    postalCode: typeof body.postalCode === 'string' ? body.postalCode : null,
    country: typeof body.country === 'string' ? body.country : null,
    pickupContactName:
      typeof body.pickupContactName === 'string' ? body.pickupContactName : null,
    note: typeof body.note === 'string' ? body.note : null,
    lines,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({
    ok: true,
    orderId: result.orderId,
    orderNumber: result.orderNumber,
    totalAmount: result.totalAmount,
  })
}
