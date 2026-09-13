import { notFound } from 'next/navigation'
import { PrintSlipActions } from '@/components/admin/PrintSlipActions'
import { PrintSlipDocument } from '@/components/admin/PrintSlipDocument'
import { PickupTicketDocument } from '@/components/admin/PickupTicketDocument'
import { STORE, storePhonesPlain } from '@/lib/constants/store'
import { requireAdminPage } from '@/lib/auth/require-admin-page'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { formatOrderNumber } from '@/lib/orders/order-number'
import { PICKUP_HOLD_HOURS, getPickupHold } from '@/lib/orders/pickup-hold'
import { formatPhoneDisplay } from '@/lib/phone-link'
import './print-slip.css'

export default async function AdminOrderPrintSlipPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ print?: string }>
}) {
  await requireAdminPage()
  const { id } = await params
  const { print } = await searchParams

  const [{ data: order }, { data: items }] = await Promise.all([
    // `*` keeps this resilient to installs that have not run pickup-flow.sql yet.
    supabaseAdmin.from('orders').select('*').eq('id', id).single(),
    supabaseAdmin.from('order_items').select('product_name, quantity').eq('order_id', id),
  ])

  if (!order) notFound()

  if (order.shipping_method === 'pickup') {
    const ticketItems = items ?? []
    const hold = getPickupHold(order.ready_for_pickup_at)
    const ticketPayload = {
      orderLabel: formatOrderNumber(order.order_number) || order.id.slice(0, 8),
      customerName: order.customer_name,
      phone: order.customer_phone ? formatPhoneDisplay(order.customer_phone) : null,
      placedLabel: new Date(order.created_at).toLocaleString(),
      holdLabel: `Hold (${PICKUP_HOLD_HOURS}h)`,
      holdValue: hold ? `until ${hold.dueAt.toLocaleString()}` : 'starts when staged',
      itemCount: ticketItems.reduce((n, i) => n + i.quantity, 0),
      items: ticketItems.map((i) => ({ name: i.product_name, quantity: i.quantity })),
      storeName: STORE.name,
      storeAddress: STORE.address,
      storeHours: STORE.hours,
      storePhones: storePhonesPlain(),
    }

    return (
      <div className="print-slip-page">
        <PrintSlipActions
          orderId={id}
          autoPrint={print === '1'}
          defaultPaper="label"
          ticketPayload={ticketPayload}
        />
        <PickupTicketDocument order={order} items={ticketItems} />
      </div>
    )
  }

  const orderLabel = formatOrderNumber(order.order_number) || order.id.slice(0, 8)
  const cityLine = [
    order.city,
    order.state ? `, ${order.state}` : '',
    order.postal_code ? ` ${order.postal_code}` : '',
  ]
    .join('')
    .trim()

  const sharePayload = {
    name: order.customer_name,
    lines: [order.address_line, cityLine, order.country].filter(Boolean),
    orderLabel,
    phone: order.customer_phone,
    shipFromLines: [
      STORE.name,
      STORE.shipFrom.street1,
      `${STORE.shipFrom.city}, ${STORE.shipFrom.state} ${STORE.shipFrom.zip}`,
      storePhonesPlain(),
    ],
  }

  return (
    <div className="print-slip-page">
      <PrintSlipActions orderId={id} autoPrint={print === '1'} sharePayload={sharePayload} />
      <PrintSlipDocument order={order} items={items ?? []} />
    </div>
  )
}
