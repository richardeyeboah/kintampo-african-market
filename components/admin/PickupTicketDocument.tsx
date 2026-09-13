import { STORE, storePhonesPlain } from '@/lib/constants/store'
import { formatOrderNumber } from '@/lib/orders/order-number'
import { PICKUP_HOLD_HOURS, getPickupHold } from '@/lib/orders/pickup-hold'
import { formatPhoneDisplay } from '@/lib/phone-link'

export type PickupTicketOrder = {
  id: string
  order_number?: number | null
  customer_name: string
  customer_phone?: string | null
  customer_email?: string | null
  created_at: string
  ready_for_pickup_at?: string | null
}

export type PickupTicketItem = {
  product_name: string
  quantity: number
}

export function PickupTicketDocument({
  order,
  items,
}: {
  order: PickupTicketOrder
  items: PickupTicketItem[]
}) {
  const orderLabel = formatOrderNumber(order.order_number) || order.id.slice(0, 8)
  const itemCount = items.reduce((n, i) => n + i.quantity, 0)
  const hold = getPickupHold(order.ready_for_pickup_at)

  return (
    <article className="print-slip-doc mx-auto max-w-lg bg-white p-6 text-black sm:p-8">
      <p className="pickup-ticket-eyebrow text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
        Store pickup ticket
      </p>

      <div className="pickup-ticket-hero mt-4 rounded-lg border-2 border-black p-5 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-600">Order</p>
        <p className="pickup-ticket-number mt-1 font-mono text-4xl font-bold leading-none">
          {orderLabel}
        </p>
        <p className="pickup-ticket-name mt-4 text-2xl font-bold leading-tight">
          {order.customer_name}
        </p>
        {order.customer_phone && (
          <p className="pickup-ticket-phone mt-1 text-lg font-medium">
            {formatPhoneDisplay(order.customer_phone)}
          </p>
        )}
      </div>

      <div className="pickup-ticket-meta mt-5 grid gap-3 border-t border-neutral-300 pt-4 text-sm">
        <div className="flex justify-between gap-4">
          <span className="font-semibold uppercase tracking-wide text-neutral-600">Items</span>
          <span className="font-bold">
            {itemCount} item{itemCount === 1 ? '' : 's'}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="font-semibold uppercase tracking-wide text-neutral-600">Placed</span>
          <span>{new Date(order.created_at).toLocaleString()}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="font-semibold uppercase tracking-wide text-neutral-600">
            Hold ({PICKUP_HOLD_HOURS}h)
          </span>
          <span className="font-bold">
            {hold ? `until ${hold.dueAt.toLocaleString()}` : 'starts when staged'}
          </span>
        </div>
        {order.customer_email && (
          <div className="pickup-ticket-email flex justify-between gap-4">
            <span className="font-semibold uppercase tracking-wide text-neutral-600">Email</span>
            <span className="break-all">{order.customer_email}</span>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="pickup-ticket-contents mt-4 border-t border-neutral-300 pt-4">
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-600">Bag contents</p>
          <ul className="mt-2 space-y-1.5 text-base">
            {items.map((item, i) => (
              <li key={`${item.product_name}-${i}`} className="flex justify-between gap-4">
                <span>{item.product_name}</span>
                <span className="font-bold tabular-nums">×{item.quantity}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="pickup-ticket-store mt-6 rounded-lg border border-dashed border-neutral-400 p-4 text-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-600">Pickup counter</p>
        <p className="mt-1 font-semibold">{STORE.name}</p>
        <p>{STORE.address}</p>
        <p>{STORE.hours}</p>
        <p>{storePhonesPlain()}</p>
      </div>
    </article>
  )
}
