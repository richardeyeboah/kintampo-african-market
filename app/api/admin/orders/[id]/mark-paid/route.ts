import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/require-admin-api'
import { assertSameOrigin } from '@/lib/security/same-origin'
import { normalizeManualSettleMethod } from '@/lib/payment-methods'
import { normalizePaymentStatus } from '@/lib/orders/order-source'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

/**
 * Mark a phone / counter order as paid (or reverse to unpaid).
 * Stripe orders cannot be toggled here — payment already settled at checkout.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const originCheck = assertSameOrigin(req)
  if (!originCheck.ok) return originCheck.response

  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { id: orderId } = await params
  const body = await req.json().catch(() => ({}))
  const paymentStatus = normalizePaymentStatus(body.paymentStatus ?? 'paid')
  const paymentMethod = normalizeManualSettleMethod(body.paymentMethod)

  const { data: order, error: fetchError } = await supabaseAdmin
    .from('orders')
    .select('id, payment_method, payment_status, refunded_at, total_amount, status')
    .eq('id', orderId)
    .single()

  if (fetchError || !order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
  }

  if (order.payment_method === 'stripe') {
    return NextResponse.json(
      { error: 'Stripe orders are paid at checkout — use refund tools instead.' },
      { status: 400 }
    )
  }

  if (order.refunded_at) {
    return NextResponse.json({ error: 'This order is already refunded.' }, { status: 400 })
  }

  const nowIso = new Date().toISOString()
  const updatePayload: Record<string, unknown> = {
    payment_status: paymentStatus,
    payment_method: paymentMethod,
    paid_at: paymentStatus === 'paid' ? nowIso : null,
  }

  const { error: updateError } = await supabaseAdmin
    .from('orders')
    .update(updatePayload)
    .eq('id', orderId)

  if (updateError) {
    // Column missing — migration not run.
    if (/payment_status|paid_at/i.test(updateError.message) || updateError.code === 'PGRST204') {
      const { error: legacyErr } = await supabaseAdmin
        .from('orders')
        .update({ payment_method: paymentMethod })
        .eq('id', orderId)
      if (legacyErr) {
        return NextResponse.json(
          { error: 'Could not update payment. Run supabase/phone-orders.sql.' },
          { status: 500 }
        )
      }
    } else {
      console.error('[mark-paid]', updateError.message)
      return NextResponse.json({ error: 'Could not update payment.' }, { status: 500 })
    }
  }

  const status = typeof order.status === 'string' ? order.status : 'ordered'
  await supabaseAdmin.from('order_status_logs').insert({
    order_id: orderId,
    from_status: status,
    to_status: status,
    note:
      paymentStatus === 'paid'
        ? `Marked paid · ${paymentMethod} · $${Number(order.total_amount ?? 0).toFixed(2)}`
        : `Marked unpaid · was ${paymentMethod}`,
  })

  return NextResponse.json({ ok: true, paymentStatus, paymentMethod })
}
