import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ProductCard, ProductCardSkeleton } from '@/components/ProductCard'
import { Button } from '@/components/ui/button'
import type { Product } from '@/types'

type ProductShowcaseProps = {
  title: string
  subtitle?: string
  products: Product[]
  errorMessage?: string | null
  eyebrow?: string
  viewAllHref?: string
  loading?: boolean
  /** Number of leading product cards to mark as priority (LCP candidates above the fold). */
  priorityCount?: number
}

export function ProductShowcase({
  title,
  subtitle,
  products,
  errorMessage,
  viewAllHref = '/shop',
  loading,
  priorityCount = 0,
}: ProductShowcaseProps) {
  return (
    <section className="page-section bg-white">
      <div className="store-container">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="section-title">{title}</h2>
            {subtitle && <p className="section-subtitle">{subtitle}</p>}
          </div>
          <Link
            href={viewAllHref}
            className="group inline-flex min-h-11 shrink-0 items-center gap-1.5 px-1 text-sm font-medium text-earth-600 no-underline hover:text-earth-900"
          >
            View all
            <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
          </Link>
        </div>

        {errorMessage && (
          <p className="error mt-6">
            {errorMessage} <Link href="/">Reload</Link>
          </p>
        )}

        {loading ? (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 && !errorMessage ? (
          <div className="mt-10 rounded-2xl border border-dashed border-earth-300 bg-earth-50 px-6 py-14 text-center">
            <p className="text-sm text-earth-700">No products to show right now.</p>
            <Link href="/shop" className="mt-4 inline-block no-underline">
              <Button variant="outline" size="sm">
                Browse shop
              </Button>
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} priority={i < priorityCount} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
