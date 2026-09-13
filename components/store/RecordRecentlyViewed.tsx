'use client'

import { useEffect } from 'react'
import { useRecentlyViewed } from '@/context/RecentlyViewedContext'
import type { Product } from '@/types'

/** Client-only side effect: log a product view into the recently-viewed list. */
export function RecordRecentlyViewed({ product }: { product: Product }) {
  const { add } = useRecentlyViewed()
  useEffect(() => {
    if (product?.id) add(product)
  }, [product, add])
  return null
}
