'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useRecentlyViewed } from '@/context/RecentlyViewedContext'
import { ProductCard } from '@/components/ProductCard'

type Props = {
  excludeId?: string
  limit?: number
}

export function RecentlyViewed({ excludeId, limit = 8 }: Props) {
  const { items } = useRecentlyViewed()
  const shown = items.filter((p) => p.id !== excludeId).slice(0, limit)

  if (shown.length < 2) return null

  return (
    <section className="page-section bg-white">
      <div className="store-container">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="section-title">Recently viewed</h2>
            <p className="section-subtitle">Pick up where you left off.</p>
          </div>
          <Link
            href="/shop"
            className="group inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-medium text-brand-700 no-underline hover:text-brand-800"
          >
            Keep browsing
            <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {shown.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
