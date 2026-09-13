import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { STORE, STORE_PHONES } from '@/lib/constants/store'
import { StorePhoneLinks } from '@/components/store/StorePhoneLinks'

export function VisitSection() {
  return (
    <section id="visit" className="scroll-mt-28 bg-earth-50 py-12 sm:py-16 lg:py-20 md:scroll-mt-24">
      <div className="store-container">
        <div className="grid overflow-hidden rounded-3xl border border-earth-200 bg-white shadow-[var(--shadow-soft)] lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative min-h-[320px] bg-earth-100 sm:min-h-[420px]">
            <Image
              src="/images/store/aisle-depth.png"
              alt="Kintampo African Market aisle — jewelry, rice, and grocery shelves"
              fill
              quality={90}
              sizes="(max-width:1024px) 100vw, 55vw"
              className="object-cover object-center"
            />
          </div>

          <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-12">
            <h2 className="section-title">Visit the store</h2>
            <p className="section-subtitle mt-2">
              Pickup online orders here — or shop the floor in Columbus.
            </p>

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
              <Link href="/shop" className="no-underline">
                <Button size="lg" className="h-11 w-full">
                  Shop online
                </Button>
              </Link>
              <div className="grid gap-2 sm:grid-cols-1">
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
      </div>
    </section>
  )
}
