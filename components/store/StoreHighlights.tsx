import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const TILES = [
  {
    href: '/shop?category=Beverages',
    src: '/images/store/house-drinks.png',
    alt: 'Kintampo Amuduro and Sobolo house drinks',
    label: 'Beverages',
    wide: true,
  },
  {
    href: '/shop?category=Dairy%20And%20Tea',
    src: '/images/store/pantry-shelf.png',
    alt: 'Pantry staples — powdered milk, malt drinks, cereals',
    label: 'Pantry',
    wide: false,
  },
  {
    href: '/shop?category=Cosmetics',
    src: '/images/store/beauty-oils.png',
    alt: 'Beauty oils and skin care on the shelf',
    label: 'Beauty & oils',
    wide: false,
  },
  {
    href: '/shop',
    src: '/images/store/aisle-depth.png',
    alt: 'Store aisle with jewelry, rice, and grocery shelves',
    label: 'Full aisles',
    wide: true,
  },
] as const

/**
 * Compact store photo mosaic — shop paths, not a second photo gallery.
 */
export function StoreHighlights() {
  return (
    <section
      id="store-photos"
      className="scroll-mt-28 border-b border-earth-200 bg-white py-10 sm:py-12 md:scroll-mt-24"
      aria-labelledby="store-photos-title"
    >
      <div className="store-container">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-earth-500">
              Columbus store
            </p>
            <h2
              id="store-photos-title"
              className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-earth-900 sm:text-3xl"
            >
              Shop the aisles online
            </h2>
          </div>
          <Link href="/shop" className="no-underline">
            <Button variant="outline" className="min-h-11">
              Shop all
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {TILES.map((tile) => (
            <Link
              key={tile.href + tile.label}
              href={tile.href}
              className={
                tile.wide
                  ? 'group relative col-span-2 aspect-[16/9] overflow-hidden rounded-2xl bg-earth-100 no-underline lg:col-span-2 lg:aspect-[4/3]'
                  : 'group relative aspect-[4/3] overflow-hidden rounded-2xl bg-earth-100 no-underline'
              }
            >
              <Image
                src={tile.src}
                alt={tile.alt}
                fill
                quality={88}
                sizes={tile.wide ? '(max-width:1024px) 100vw, 50vw' : '(max-width:1024px) 50vw, 25vw'}
                className="object-cover object-center transition-transform duration-150 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-earth-950/75 to-transparent p-3 pt-12 sm:p-4">
                <p className="text-sm font-semibold text-white sm:text-base">{tile.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
