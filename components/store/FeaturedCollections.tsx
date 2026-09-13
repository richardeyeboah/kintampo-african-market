import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { FEATURED_COLLECTIONS } from '@/lib/constants/collections'
import {
  getBeveragesCollectionImage,
  getCategoryImage,
  getCosmeticsCollectionImage,
} from '@/lib/constants/category-images'

const COLLECTION_CATEGORY: Record<string, string> = {
  fashion: 'African Prints',
  staples: 'Flours & Rice',
  produce: 'Fresh Produce',
}

export function FeaturedCollections({
  showFashion = false,
}: {
  showFashion?: boolean
}) {
  const collections = FEATURED_COLLECTIONS.filter((col) => showFashion || col.id !== 'fashion').map(
    (col) => {
      if (col.id === 'beverages') {
        return { ...col, image: getBeveragesCollectionImage() }
      }
      if (col.id === 'beauty') {
        return { ...col, image: getCosmeticsCollectionImage() }
      }
      const cat = COLLECTION_CATEGORY[col.id]
      const fromCat = cat ? getCategoryImage(cat) : undefined
      return fromCat ? { ...col, image: fromCat } : col
    }
  )

  const cols =
    collections.length >= 5
      ? 'lg:grid-cols-3 xl:grid-cols-5'
      : collections.length === 4
        ? 'lg:grid-cols-4'
        : 'lg:grid-cols-3'

  return (
    <section className="page-section bg-earth-50">
      <div className="store-container">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="section-title">Shop by department</h2>
            <p className="section-subtitle">
              {showFashion
                ? 'Fashion, staples, produce, drinks & beauty.'
                : 'Staples, produce, drinks & beauty.'}
            </p>
          </div>
          <Link
            href="/shop"
            className="group inline-flex min-h-11 shrink-0 items-center gap-1.5 px-1 text-sm font-medium text-earth-600 no-underline hover:text-earth-900"
          >
            View all
            <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="-mx-4 mt-10 sm:mx-0">
          <div
            className={`flex gap-4 overflow-x-auto scrollbar-none px-4 pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:gap-5 ${cols}`}
          >
            {collections.map((col) => (
              <Link
                key={col.id}
                href={col.href}
                className="group min-w-[260px] shrink-0 overflow-hidden rounded-2xl border border-earth-200 bg-white shadow-[var(--shadow-card)] no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-earth-300 hover:shadow-[var(--shadow-card-hover)] sm:min-w-0 sm:shrink"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-earth-100">
                  <Image
                    src={col.image}
                    alt=""
                    fill
                    quality={90}
                    unoptimized={col.image.startsWith('/images/categories/')}
                    className="object-cover object-center transition-transform duration-200 group-hover:scale-[1.02]"
                    sizes="(max-width:640px) 75vw, 25vw"
                    aria-hidden
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-base font-medium text-earth-900">{col.title}</h3>
                  <p className="mt-1 text-sm text-earth-500">{col.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
