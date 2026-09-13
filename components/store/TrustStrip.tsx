import { CreditCard, MapPin, Package, Truck } from 'lucide-react'
import { formatInStockShort } from '@/lib/catalog-stats'
import { STORE } from '@/lib/constants/store'
import { StorePhoneLinks } from '@/components/store/StorePhoneLinks'
import { FREE_STANDARD_SHIPPING_SUBTOTAL } from '@/lib/shipping'

function trustItems(inStockCount: number) {
  return [
    {
      icon: Truck,
      title: `Free shipping $${FREE_STANDARD_SHIPPING_SUBTOTAL}+`,
      desc: 'Standard US delivery on qualifying orders.',
    },
    {
      icon: MapPin,
      title: 'Store pickup',
      desc: `Same-day pickup · ${STORE.address}`,
    },
    {
      icon: Package,
      title: formatInStockShort(inStockCount),
      desc: 'Ships within 24h on in-stock items.',
    },
    {
      icon: CreditCard,
      title: 'Secure checkout',
      desc: 'Powered by Stripe. All major cards accepted.',
    },
  ] as const
}

export function TrustStrip({ inStockCount }: { inStockCount: number }) {
  const items = trustItems(inStockCount)

  return (
    <section className="border-b border-earth-200 bg-white py-8 sm:py-10">
      <div className="store-container">
        <ul className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, title, desc }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-earth-200 bg-earth-50 text-earth-600">
                <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-earth-900">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-earth-600">{desc}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-earth-200 pt-6 text-xs text-earth-600">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-earth-500" strokeWidth={1.75} aria-hidden />
            {STORE.address}
          </span>
          <StorePhoneLinks
            linkClassName="inline-flex min-h-11 items-center font-medium text-earth-700 no-underline hover:text-earth-900"
          />
          <span className="text-earth-500">{STORE.hours}</span>
        </div>
      </div>
    </section>
  )
}
