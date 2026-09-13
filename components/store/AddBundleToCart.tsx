'use client'

import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/button'
import type { ProductBundle } from '@/lib/supabase/bundles'

export function AddBundleToCart({ bundle }: { bundle: ProductBundle }) {
  const { addItem } = useCart()
  const toast = useToast()

  function addAll() {
    let added = 0
    for (const line of bundle.items) {
      if (!line.product.in_stock) continue
      addItem(line.product, line.quantity)
      added += 1
    }
    if (added === 0) {
      toast?.show('No in-stock items in this kit')
      return
    }
    toast?.show(`Added kit: ${bundle.name}`)
  }

  return (
    <Button type="button" className="min-h-11 w-full sm:w-auto" onClick={addAll}>
      Add kit to cart
    </Button>
  )
}
