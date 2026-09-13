'use client'

import { useEffect, useState } from 'react'
import { Check, Plus } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/lib/utils'
import { MOBILE_BOTTOM_NAV_OFFSET } from '@/lib/constants/mobile-nav'
import type { Product } from '@/types'

export function ProductStickyBar({
  product,
  sentinelId,
}: {
  product: Product
  sentinelId: string
}) {
  const [visible, setVisible] = useState(false)
  const [added, setAdded] = useState(false)
  const { addItem } = useCart()
  const toast = useToast()

  useEffect(() => {
    const el = document.getElementById(sentinelId)
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [sentinelId])

  useEffect(() => {
    if (!added) return
    const t = setTimeout(() => setAdded(false), 1200)
    return () => clearTimeout(t)
  }, [added])

  if (!product.in_stock) return null

  return (
    <div
      className="fixed left-0 right-0 z-30 border-t border-earth-200 bg-white px-4 py-2.5 shadow-[0_-4px_20px_rgb(0_0_0/0.06)] transition-transform duration-200 lg:hidden"
      style={{
        bottom: MOBILE_BOTTOM_NAV_OFFSET,
        transform: visible ? 'translateY(0)' : 'translateY(110%)',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-[11px] font-medium uppercase tracking-wider text-earth-500">
            {product.category}
          </p>
          <p className="text-[15px] font-semibold tabular-nums text-earth-900">
            {formatMoney(product.price)}
          </p>
        </div>
        <Button
          type="button"
          className="h-11 shrink-0 gap-1.5 px-5"
          onClick={() => {
            addItem(product, 1)
            setAdded(true)
            toast?.show(`Added: ${product.name}`)
          }}
        >
          {added ? (
            <>
              <Check className="h-4 w-4" aria-hidden />
              Added
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" aria-hidden />
              Add to cart
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
