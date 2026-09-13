import type { Metadata } from 'next'
import { PageHeader } from '@/components/store/PageHeader'
import { TapLink } from '@/components/store/TapLink'
import { STORE } from '@/lib/constants/store'
import {
  FREE_STANDARD_SHIPPING_SUBTOTAL,
  LOCAL_DELIVERY_FEE,
  LOCAL_DELIVERY_MIN_SUBTOTAL,
} from '@/lib/shipping'
import { LOCAL_DELIVERY_MAX_MINUTES } from '@/lib/delivery/local-delivery-eligibility'
import { PICKUP_HOLD_HOURS } from '@/lib/orders/pickup-hold'

export const metadata: Metadata = {
  title: 'Shipping & Pickup',
  description: 'Store pickup, local delivery, and US shipping rates.',
}

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-white">
      <PageHeader
        eyebrow="Policies"
        title="Shipping & pickup"
        subtitle="Rates and options at checkout."
      />
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="store-container max-w-3xl space-y-8 text-base leading-relaxed text-earth-700">
          <div className="premium-card space-y-3 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-earth-900">Store pickup</h2>
            <p>
              Free pickup at {STORE.address}. Hours: {STORE.hours}. Choose a pickup window at
              checkout. Ready orders are held for {PICKUP_HOLD_HOURS} hours.
            </p>
          </div>

          <div className="premium-card space-y-3 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-earth-900">Local delivery</h2>
            <p>
              Same-day local delivery within about {LOCAL_DELIVERY_MAX_MINUTES} minutes drive of the
              store. Flat fee ${LOCAL_DELIVERY_FEE}. Minimum merchandise subtotal $
              {LOCAL_DELIVERY_MIN_SUBTOTAL}. Optional driver tip at checkout.
            </p>
          </div>

          <div className="premium-card space-y-3 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-earth-900">US shipping</h2>
            <p>
              We ship nationwide via USPS and partner carriers. Standard shipping is free on orders
              of ${FREE_STANDARD_SHIPPING_SUBTOTAL}+ merchandise subtotal. Rates and estimated
              delivery times show at checkout. Times are estimates, not guarantees.
            </p>
          </div>

          <div className="premium-card space-y-3 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-earth-900">Sales tax</h2>
            <p>
              Ohio sales tax applies to taxable non-food items per state law. Food grocery items are
              generally not taxed.
            </p>
          </div>

          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-earth-600">
            <span>More answers in the</span>
            <TapLink href="/faq">FAQ</TapLink>
            <span aria-hidden>·</span>
            <span>Returns:</span>
            <TapLink href="/returns">Returns</TapLink>
          </p>
        </div>
      </section>
    </div>
  )
}
