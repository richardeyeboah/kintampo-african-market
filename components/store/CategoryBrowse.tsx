import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { CategoryIcon } from '@/components/store/CategoryIcon'
import { CategoryTilePhoto } from '@/components/store/CategoryTilePhoto'
import { getCategoryImage } from '@/lib/constants/category-images'
import { isFashionCategory } from '@/lib/constants/categories'

type CategoryBrowseProps = {
  displayCategories: readonly string[]
  categoryCount: Record<string, number>
  fashionCount?: number
}

export function CategoryBrowse({
  displayCategories,
  categoryCount,
  fashionCount = 0,
}: CategoryBrowseProps) {
  const fashionImage =
    getCategoryImage('African Prints') ?? getCategoryImage('Ready-to-wear')

  return (
    <section id="categories" className="page-section bg-white">
      <div className="store-container">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="section-title">Shop by category</h2>
            <p className="section-subtitle">
              {(() => {
                const stocked = Object.values(categoryCount).filter((n) => n > 0).length
                const total = Object.values(categoryCount).reduce((a, b) => a + b, 0)
                return total > 0
                  ? `${stocked} departments · ${total.toLocaleString()} products in stock`
                  : `${stocked} departments`
              })()}
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

        {fashionCount > 0 && (
          <Link
            href="/fashion"
            className="group relative mt-8 flex min-h-[7.5rem] overflow-hidden rounded-2xl border border-earth-200 bg-accent-50 no-underline shadow-[var(--shadow-card)] transition-shadow duration-150 hover:shadow-[var(--shadow-card-hover)] sm:min-h-[8.5rem]"
          >
            <span className="absolute inset-y-0 left-0 flex w-2 sm:w-2.5" aria-hidden>
              <span className="h-full w-full bg-[linear-gradient(180deg,var(--color-brand-600)_0%,var(--color-accent-500)_35%,var(--color-earth-800)_70%,var(--color-brand-700)_100%)]" />
            </span>
            {fashionImage && (
              <CategoryTilePhoto
                src={fashionImage}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-center opacity-25 transition-transform duration-200 group-hover:scale-[1.02]"
              />
            )}
            <span className="relative flex w-full items-end justify-between gap-4 p-5 pl-6 sm:p-6 sm:pl-7">
              <span>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700">
                  Department
                </span>
                <span className="mt-1 block text-xl font-semibold tracking-tight text-earth-900 sm:text-2xl">
                  Fashion
                </span>
                <span className="mt-1 block text-sm text-earth-600">
                  Prints, lace, ready-to-wear &amp; hair
                </span>
              </span>
              <span className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white transition-colors duration-150 group-hover:bg-brand-700">
                Shop fashion
                <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </span>
          </Link>
        )}

        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
          {displayCategories.map((cat) => {
            const imageUrl = getCategoryImage(cat)
            const count = categoryCount[cat] ?? 0

            return (
              <li key={cat} className="min-w-0">
                <Link
                  href={
                    isFashionCategory(cat)
                      ? `/fashion?category=${encodeURIComponent(cat)}`
                      : `/shop?category=${encodeURIComponent(cat)}`
                  }
                  className="category-tile group block min-w-0 no-underline"
                >
                  <div className="relative aspect-square overflow-hidden bg-earth-50">
                    {imageUrl ? (
                      <CategoryTilePhoto
                        src={imageUrl}
                        alt={cat}
                        loading={cat === 'Beverages' || cat === 'Bread' ? 'eager' : 'lazy'}
                        className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-200 group-hover:scale-[1.02]"
                      >
                        <span className="absolute inset-0 flex items-center justify-center bg-earth-100">
                          <CategoryIcon category={cat} className="h-10 w-10 text-earth-500" />
                        </span>
                      </CategoryTilePhoto>
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center bg-earth-100">
                        <CategoryIcon category={cat} className="h-10 w-10 text-earth-500" />
                      </span>
                    )}
                  </div>
                  <div className="border-t border-earth-100 p-4">
                    <h3 className="line-clamp-1 text-sm font-medium text-earth-900">{cat}</h3>
                    <p className="mt-1 text-xs text-earth-500">
                      {count > 0 ? `${count} item${count === 1 ? '' : 's'}` : 'View'}
                    </p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
