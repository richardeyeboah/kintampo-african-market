import { STORE, storePhonesPlain } from '@/lib/constants/store'
import { formatOrderNumber } from '@/lib/orders/order-number'
import { SHIPPING_METHOD_LABEL, type ShippingMethod } from '@/lib/shipping'

export type PrintSlipOrder = {
  id: string
  order_number?: number | null
  customer_name: string
  customer_phone?: string | null
  customer_email?: string | null
  address_line: string
  city: string
  state?: string | null
  postal_code?: string | null
  country: string
  shipping_method?: string | null
  created_at: string
}

export type PrintSlipItem = {
  product_name: string
  quantity: number
}

type Props = {
  order: PrintSlipOrder
  items: PrintSlipItem[]
}

export function PrintSlipDocument({ order, items }: Props) {
  const orderLabel = formatOrderNumber(order.order_number) || order.id.slice(0, 8)
  const shipMethod =
    SHIPPING_METHOD_LABEL[(order.shipping_method as ShippingMethod) ?? 'standard'] ??
    order.shipping_method ??
    'Standard'
  const itemCount = items.reduce((n, i) => n + i.quantity, 0)

  return (
    <article className="print-slip-doc mx-auto max-w-lg bg-white p-6 text-black sm:p-8">
      <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
        Shipping label
      </p>

      <div className="mt-4 rounded-lg border-2 border-black p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-600">Ship to</p>
        <p className="mt-2 text-2xl font-bold leading-tight">{order.customer_name}</p>
        <p className="mt-3 text-lg leading-snug">{order.address_line}</p>
        <p className="text-lg leading-snug">
          {order.city}
          {order.state ? `, ${order.state}` : ''}
          {order.postal_code ? ` ${order.postal_code}` : ''}
        </p>
        <p className="text-lg leading-snug">{order.country}</p>
        {order.customer_phone && (
          <p className="mt-3 text-base font-medium">Phone: {order.customer_phone}</p>
        )}
      </div>

      <div className="mt-5 grid gap-3 border-t border-neutral-300 pt-4 text-sm">
        <div className="flex justify-between gap-4">
          <span className="font-semibold uppercase tracking-wide text-neutral-600">Order</span>
          <span className="font-mono font-bold">{orderLabel}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="font-semibold uppercase tracking-wide text-neutral-600">Shipping</span>
          <span>{shipMethod}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="font-semibold uppercase tracking-wide text-neutral-600">Items</span>
          <span>
            {itemCount} item{itemCount === 1 ? '' : 's'}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="font-semibold uppercase tracking-wide text-neutral-600">Placed</span>
          <span>{new Date(order.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {items.length > 0 && (
        <div className="mt-4 border-t border-neutral-300 pt-4">
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-600">Contents</p>
          <ul className="mt-2 space-y-1 text-sm">
            {items.map((item, i) => (
              <li key={`${item.product_name}-${i}`}>
                {item.quantity}× {item.product_name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 rounded-lg border border-dashed border-neutral-400 p-4 text-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-600">Ship from</p>
        <p className="mt-1 font-semibold">{STORE.name}</p>
        <p>{STORE.shipFrom.street1}</p>
        <p>
          {STORE.shipFrom.city}, {STORE.shipFrom.state} {STORE.shipFrom.zip}
        </p>
        <p>{storePhonesPlain()}</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-neutral-300 pt-4 text-sm">
        <div>
          <p className="text-xs font-bold uppercase text-neutral-500">Weight (fill in)</p>
          <p className="mt-6 border-b border-neutral-400" />
          <p className="mt-1 text-xs text-neutral-500">lbs</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-neutral-500">Tracking (after drop-off)</p>
          <p className="mt-6 border-b border-neutral-400" />
        </div>
      </div>
    </article>
  )
}
