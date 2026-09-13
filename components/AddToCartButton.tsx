'use client'

import { useEffect, useState } from 'react'
import { Check, Minus, Plus, ShoppingBag } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/lib/utils'
import type { Product } from '@/types'

export function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart()
  const toast = useToast()
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!added) return
    const t = setTimeout(() => setAdded(false), 1400)
    return () => clearTimeout(t)
  }, [added])

  if (!product.in_stock) {
    return (
      <Button type="button" disabled variant="outline" className="h-11 w-full">
        Out of stock
      </Button>
    )
  }

  function handleAdd() {
    addItem(product, quantity)
    toast?.show(`Added ${quantity} × ${product.name}`)
    setAdded(true)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-earth-700">Quantity</span>
        <div className="inline-flex items-center rounded-md border border-earth-200 bg-white">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center text-earth-700 transition-colors hover:bg-earth-50 disabled:opacity-40"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-[2.25rem] text-center text-sm font-semibold tabular-nums text-earth-900">
            {quantity}
          </span>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center text-earth-700 transition-colors hover:bg-earth-50"
            aria-label="Increase quantity"
            onClick={() => setQuantity((q) => Math.min(99, q + 1))}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Button
        type="button"
        size="lg"
        className="h-11 w-full gap-2"
        onClick={handleAdd}
      >
        {added ? (
          <>
            <Check className="h-4 w-4" aria-hidden />
            Added ({quantity})
          </>
        ) : (
          <>
            <ShoppingBag className="h-4 w-4" aria-hidden />
            Add to cart · {formatMoney(product.price * quantity)}
          </>
        )}
      </Button>
    </div>
  )
}
