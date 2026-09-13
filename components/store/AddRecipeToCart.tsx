'use client'

import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/button'
import type { Product } from '@/types'

type IngredientLine = {
  product: Product
  quantity: number
}

export function AddRecipeToCart({
  recipeTitle,
  ingredients,
}: {
  recipeTitle: string
  ingredients: IngredientLine[]
}) {
  const { addItem } = useCart()
  const toast = useToast()

  const linkable = ingredients.filter((i) => i.product.in_stock)

  function addAll() {
    if (linkable.length === 0) {
      toast?.show('No in-stock ingredients to add')
      return
    }
    for (const line of linkable) {
      addItem(line.product, line.quantity)
    }
    toast?.show(`Added ingredients: ${recipeTitle}`)
  }

  if (ingredients.length === 0) return null

  return (
    <Button
      type="button"
      className="min-h-11 w-full sm:w-auto"
      onClick={addAll}
      disabled={linkable.length === 0}
    >
      Add ingredients to cart
      {linkable.length > 0 ? ` (${linkable.length})` : ''}
    </Button>
  )
}
