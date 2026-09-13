import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Phone } from 'lucide-react'
import { PageHeader } from '@/components/store/PageHeader'
import { StorePhoneLinks } from '@/components/store/StorePhoneLinks'
import { STORE, STORE_PHONES } from '@/lib/constants/store'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'About & Visit',
  description: `${STORE.name} — address, hours, and directions in Columbus, OH.`,
}

export default function AboutPage() {
  const mapsQuery = encodeURIComponent(STORE.address)
  const embedSrc = `https://www.google.com/maps?q=${mapsQuery}&output=embed`
  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`

  return (
    <div className="min-h-screen bg-white">
      <PageHeader
        title={STORE.name}
        subtitle="Store pickup and US shipping from Columbus, OH."
      />

      {/* Photo plane + visit info — VisitSection pattern */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="store-container">
          <div className="grid overflow-hidden rounded-2xl border border-earth-200 bg-white shadow-[var(--shadow-card)] lg:grid-cols-[1.2fr_0.8fr]">
            <div className="relative min-h-[280px] bg-earth-100 sm:min-h-[400px] lg:min-h-[480px]">
              <Image
                src="/images/store/aisle-depth.png"
                alt={`${STORE.name} aisle — shelves and grocery floor`}
                fill
                priority
                quality={90}
                sizes="(max-width:1024px) 100vw, 60vw"
                className="object-cover object-center"
              />
            </div>

            <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
              <p className="text-xs font-semibold uppercase tracking-wider text-earth-500">Visit</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-earth-900 sm:text-2xl">
                Columbus store
              </h2>

              <dl className="mt-6 space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-earth-500" strokeWidth={1.75} aria-hidden />
                  <div>
                    <dt className="sr-only">Address</dt>
                    <dd className="font-medium text-earth-900">{STORE.address}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-earth-500" strokeWidth={1.75} aria-hidden />
                  <div>
                    <dt className="sr-only">Phone</dt>
                    <dd>
                      <StorePhoneLinks />
                    </dd>
                  </div>
                </div>
                <div className="pl-7 text-earth-600">{STORE.hours}</div>
              </dl>

              <div className="mt-8 flex flex-col gap-3">
                <a href={directionsHref} target="_blank" rel="noopener noreferrer" className="no-underline">
                  <Button size="lg" className="h-11 w-full">
                    Get directions
                  </Button>
                </a>
                <Link href="/shop" className="no-underline">
                  <Button size="lg" variant="outline" className="h-11 w-full">
                    Shop online
                  </Button>
                </Link>
              </div>

              <div className="mt-4 grid gap-2">
                {STORE_PHONES.map((p) => (
                  <a key={p.href} href={p.href} className="no-underline">
                    <Button size="lg" variant="outline" className="h-11 w-full">
                      Call {p.label}
                    </Button>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map secondary */}
      <section className="border-t border-earth-100 bg-earth-50 py-12 sm:py-16 lg:py-20">
        <div className="store-container">
          <h2 className="text-lg font-semibold tracking-tight text-earth-900">Map</h2>
          <p className="mt-1 text-sm text-earth-600">{STORE.address}</p>
          <div className="mt-6 overflow-hidden rounded-2xl border border-earth-200 bg-white shadow-[var(--shadow-card)]">
            <iframe
              title={`Map — ${STORE.name}`}
              src={embedSrc}
              className="h-[280px] w-full border-0 sm:h-[360px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </section>
    </div>
  )
}
