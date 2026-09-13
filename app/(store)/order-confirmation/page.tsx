import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CheckCircle2, Package, Receipt } from 'lucide-react'
import { createClientOptional } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { OrderStatusTimeline } from '@/components/account/OrderStatusTimeline'
import { PickupReceiptActions } from '@/components/store/PickupReceiptActions'
import { PageHeader } from '@/components/store/PageHeader'
import { Button } from '@/components/ui/button'
import { isPickupShippingMethod, normalizeOrderStatus, orderStatusLabel } from '@/lib/order-status'
import { normalizePaymentMethod } from '@/lib/payment-methods'
import { SHIPPING_METHOD_LABEL, type ShippingMethod } from '@/lib/shipping'
import { STORE } from '@/lib/constants/store'
import { formatMoney } from '@/lib/utils'
import { formatOrderNumber } from '@/lib/orders/order-number'

export const dynamic = 'force-dynamic'

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const supabase = await createClientOptional()
  if (!supabase) redirect('/login?next=/order-confirmation&error=configuration')
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { id } = await searchParams
  const isGuestView = !user

  let order: {
    id: string
    order_number: number | null
    status: string
    shipping_method: string | null
    shipping_fee: number | null
    total_amount: number | null
    subtotal_amount: number | null
    tracking_number: string | null
    payment_method: string | null
    pickup_contact_name: string | null
  } | null = null

  if (id) {
    let query = supabaseAdmin
      .from('orders')
      .select(
        'id,order_number,status,shipping_method,shipping_fee,total_amount,subtotal_amount,tracking_number,payment_method,pickup_contact_name'
      )
      .eq('id', id)

    if (isGuestView) {
      query = query.is('user_id', null)
    } else {
      query = query.eq('user_id', user!.id)
    }

    const { data } = await query.maybeSingle()
    order = data
  }

  const orderNumberLabel = order ? formatOrderNumber(order.order_number) : ''

  const normalizedStatus = normalizeOrderStatus(order?.status)
  const shippingMethod = (order?.shipping_method as ShippingMethod | null | undefined) ?? 'standard'
  const isPickup = isPickupShippingMethod(order?.shipping_method)
  const paymentMethod = order ? normalizePaymentMethod(order.payment_method) : null

  return (
    <div className="min-h-screen bg-cream">
      <PageHeader
        eyebrow="Order confirmed"
        title="Thank you for your order"
        subtitle="Kintampo African Market — we'll take it from here."
        centered
      />

      <div className="store-container py-10 sm:py-12">
        <div className="mx-auto max-w-2xl text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-brand-600" strokeWidth={1.5} />

          {paymentMethod === 'stripe' && (
            <p className="success mt-6">
              Payment received. A confirmation email is on the way.
            </p>
          )}
          {paymentMethod === 'cod' && (
            <p className="mt-6 text-earth-700">Cash on delivery — pay when your order arrives.</p>
          )}

          {orderNumberLabel && (
            <p className="mt-4 text-sm text-earth-600">
              Order number:{' '}
              <span className="font-mono text-base font-semibold tracking-tight text-earth-900">
                {orderNumberLabel}
              </span>
            </p>
          )}

          {!order && id && (
            <p className="error mt-4">
              {isGuestView
                ? 'We could not find that order. Use the link from your confirmation email or track with your order number and email.'
                : "We couldn't find that order under your account."}
            </p>
          )}
        </div>

        {order && (
          <div className="mx-auto mt-12 grid max-w-4xl gap-8 md:grid-cols-2">
            <div className="premium-card p-6 sm:p-8">
              <h2 className="text-base font-semibold text-earth-900">
                {isPickup ? 'Pickup progress' : 'Delivery progress'}
              </h2>
              <div className="mt-6">
                <OrderStatusTimeline status={order.status} shippingMethod={order.shipping_method} />
              </div>
              {isPickup && (
                <div className="mt-6 rounded-lg bg-brand-50/60 p-3">
                  <p className="text-xs leading-relaxed text-earth-600">
                    We&apos;ll email you when your order is ready at {STORE.address}. Sending an
                    Uber, DoorDash, or a friend? Give them this receipt to show at the counter.
                  </p>
                  <PickupReceiptActions
                    orderNumberLabel={orderNumberLabel || order.id}
                    pickupContactName={order.pickup_contact_name}
                    total={Number(order.total_amount ?? 0)}
                  />
                </div>
              )}
            </div>

            <div className="premium-card p-6 sm:p-8">
              <h2 className="text-base font-semibold text-earth-900">Order summary</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-earth-500">Status</dt>
                  <dd className="font-semibold text-earth-900">
                    {orderStatusLabel(normalizedStatus, { pickup: isPickup })}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-earth-500">{isPickup ? 'Fulfillment' : 'Shipping'}</dt>
                  <dd className="font-medium text-earth-900">
                    {SHIPPING_METHOD_LABEL[shippingMethod]}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-earth-500">{isPickup ? 'Pickup fee' : 'Shipping fee'}</dt>
                  <dd className="font-medium text-earth-900">
                    {formatMoney(Number(order.shipping_fee ?? 0))}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-earth-100 pt-3">
                  <dt className="font-semibold text-earth-800">Total</dt>
                  <dd className="text-lg font-bold text-earth-950">
                    {formatMoney(Number(order.total_amount ?? 0))}
                  </dd>
                </div>
                {order.tracking_number && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-earth-500">Tracking #</dt>
                    <dd className="font-medium text-earth-900">{order.tracking_number}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        )}

        <div className="mx-auto mt-12 flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
          {order && (
            <Link
              href={`/receipt?id=${encodeURIComponent(orderNumberLabel || order.id)}`}
              className="no-underline"
            >
              <Button variant="default" className="h-12 w-full gap-2 rounded-xl sm:w-auto">
                <Receipt className="h-4 w-4" />
                Get receipt
              </Button>
            </Link>
          )}
          {order && (
            <Link
              href={`/track-order?id=${encodeURIComponent(orderNumberLabel || order.id)}`}
              className="no-underline"
            >
              <Button variant="outline" className="h-12 w-full gap-2 rounded-xl sm:w-auto">
                <Package className="h-4 w-4" />
                Track this order
              </Button>
            </Link>
          )}
          {!isGuestView && (
            <Link href="/account" className="no-underline">
              <Button variant="outline" className="h-12 w-full rounded-xl sm:w-auto">
                My account
              </Button>
            </Link>
          )}
          <Link href="/shop" className="no-underline">
            <Button className="h-12 w-full rounded-xl sm:w-auto">
              Continue shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
