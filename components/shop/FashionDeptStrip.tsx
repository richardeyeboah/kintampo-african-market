import Link from 'next/link'
import { FASHION_CATEGORIES } from '@/lib/constants/categories'
import { getCategoryImage } from '@/lib/constants/category-images'
import { CategoryIcon } from '@/components/store/CategoryIcon'
import { CategoryTilePhoto } from '@/components/store/CategoryTilePhoto'
import { cn } from '@/lib/utils'

type FashionDeptStripProps = {
  activeCategory: string | null
  categoryCount: Record<string, number>
}

export function FashionDeptStrip({ activeCategory, categoryCount }: FashionDeptStripProps) {
  const cats = FASHION_CATEGORIES.filter(
    (cat) => (categoryCount[cat] ?? 0) > 0 || activeCategory === cat
  )
  // One type isn't a browse strip — skip until multiple fashion types are stocked.
  if (cats.length < 2) return null

  return (
    <ul
      className={cn(
        'grid gap-2.5 sm:gap-3',
        cats.length === 2
          ? 'grid-cols-2'
          : cats.length === 3
            ? 'grid-cols-2 sm:grid-cols-3'
            : cats.length === 4
              ? 'grid-cols-2 sm:grid-cols-4'
              : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
      )}
    >
      {cats.map((cat) => {
        const imageUrl = getCategoryImage(cat)
        const active = activeCategory === cat
        const href = active
          ? '/fashion'
          : `/fashion?category=${encodeURIComponent(cat)}`

        return (
          <li key={cat}>
            <Link
              href={href}
              className={cn(
                'group block overflow-hidden rounded-xl border bg-white no-underline transition-colors duration-150',
                active
                  ? 'border-brand-600 shadow-[var(--shadow-card)]'
                  : 'border-earth-200 hover:border-earth-300'
              )}
            >
              <span className="relative block aspect-[5/3] bg-accent-50 sm:aspect-[4/3]">
                {imageUrl ? (
                  <CategoryTilePhoto
                    src={imageUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                  >
                    <span className="absolute inset-0 flex items-center justify-center">
                      <CategoryIcon category={cat} className="h-10 w-10 text-earth-400" />
                    </span>
                  </CategoryTilePhoto>
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <CategoryIcon category={cat} className="h-10 w-10 text-earth-400" />
                  </span>
                )}
                <span className="absolute inset-x-0 top-0 flex h-1.5" aria-hidden>
                  <span className="flex-1 bg-brand-600" />
                  <span className="flex-1 bg-accent-500" />
                  <span className="flex-1 bg-earth-800" />
                  <span className="flex-1 bg-brand-700" />
                </span>
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/90 to-transparent px-2.5 pb-2.5 pt-8 sm:px-3 sm:pb-3">
                  <span className="block truncate text-sm font-semibold text-earth-900">
                    {cat}
                  </span>
                </span>
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
