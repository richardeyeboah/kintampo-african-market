import type { Product } from '@/types'
import { LOW_STOCK_THRESHOLD } from '@/lib/orders/grocery-ops'
import { extractPackSize } from '@/lib/product-display'

export type UnitOfMeasure = 'lb' | 'oz' | 'kg' | 'g' | 'ct' | 'ml' | 'l'

export type ProductExtras = {
  brand?: string | null
  dietary_tags?: string[] | null
  stock_quantity?: number | null
  unit_amount?: number | null
  unit_of_measure?: string | null
  pack_label?: string | null
  variant_group?: string | null
}

export type StoreProduct = Product & ProductExtras

/** Columns for storefront product selects (includes Tier 2–4 fields when migrated). */
export const STOREFRONT_PRODUCT_SELECT =
  'id,name,price,image_url,image_urls,category,in_stock,description,created_at,brand,dietary_tags,stock_quantity,unit_amount,unit_of_measure,pack_label,variant_group'

/** Older installs without grocery-ops.sql. */
export const STOREFRONT_PRODUCT_SELECT_LEGACY =
  'id,name,price,image_url,image_urls,category,in_stock,description,created_at'

export function packLabel(product: Pick<StoreProduct, 'name' | 'description' | 'pack_label'>): string | null {
  if (product.pack_label?.trim()) return product.pack_label.trim()
  return extractPackSize(product)
}

export function unitPricePerMeasure(
  product: Pick<StoreProduct, 'price' | 'unit_amount' | 'unit_of_measure'>
): { amount: number; measure: string } | null {
  const amount = Number(product.unit_amount)
  const measure = (product.unit_of_measure ?? '').trim().toLowerCase()
  if (!Number.isFinite(amount) || amount <= 0 || !measure) return null
  const per = Number(product.price) / amount
  if (!Number.isFinite(per) || per <= 0) return null
  return { amount: Math.round(per * 100) / 100, measure }
}

export function formatUnitPrice(product: StoreProduct): string | null {
  const u = unitPricePerMeasure(product)
  if (!u) return null
  return `$${u.amount.toFixed(2)}/${u.measure}`
}

export function effectiveInStock(product: Pick<StoreProduct, 'in_stock' | 'stock_quantity'>): boolean {
  if (typeof product.stock_quantity === 'number' && Number.isFinite(product.stock_quantity)) {
    return product.stock_quantity > 0
  }
  return Boolean(product.in_stock)
}

/** Max units a shopper can put in cart (stock_quantity when tracked, else 99). */
export function maxCartQuantity(
  product: Pick<StoreProduct, 'in_stock' | 'stock_quantity'>
): number {
  if (!effectiveInStock(product)) return 0
  const qty = product.stock_quantity
  if (typeof qty === 'number' && Number.isFinite(qty) && qty >= 0) {
    return Math.min(99, Math.max(0, Math.trunc(qty)))
  }
  return 99
}

export function lowStockCount(
  product: Pick<StoreProduct, 'stock_quantity' | 'in_stock'>
): number | null {
  const qty = product.stock_quantity
  if (typeof qty !== 'number' || !Number.isFinite(qty)) return null
  if (qty <= 0) return null
  if (qty <= LOW_STOCK_THRESHOLD) return Math.trunc(qty)
  return null
}
