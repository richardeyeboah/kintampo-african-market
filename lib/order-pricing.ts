import type { CartItem } from '@/types'

export type SanitizedCartLine = {
  productId: string
  quantity: number
}

export type AuthoritativeProduct = {
  id: string
  name: string
  price: number
  in_stock: boolean
}

export type AuthoritativeOrderItem = {
  product_id: string
  product_name: string
  product_price: number
  quantity: number
  subtotal: number
}

export function sanitizeCartItems(items: CartItem[]) {
  return items
    .map((item) => ({
      productId: item?.product?.id,
      quantity: Number(item?.quantity ?? 0),
    }))
    .filter(
      (item): item is SanitizedCartLine =>
        typeof item.productId === 'string' &&
        item.productId.trim().length > 0 &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0 &&
        item.quantity <= 99
    )
}

export function buildAuthoritativeOrderItems(
  items: SanitizedCartLine[],
  productMap: Map<string, AuthoritativeProduct>
) {
  const orderItems: AuthoritativeOrderItem[] = items.map((item) => {
    const product = productMap.get(item.productId)
    if (!product) {
      throw new Error(`Missing authoritative product for ${item.productId}`)
    }

    return {
      product_id: product.id,
      product_name: product.name,
      product_price: product.price,
      quantity: item.quantity,
      subtotal: product.price * item.quantity,
    }
  })

  const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0)

  return { orderItems, subtotal }
}
