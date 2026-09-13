import type { Product } from '@/types'

const PACK_SIZE_RE =
  /\b(\d+(?:\.\d+)?\s*(?:oz|fl\.?\s*oz|lb|lbs|kg|g|ml|l|liter|litre|pack|pk|ct|count)s?)\b/i

/** Best-effort pack size from product name or description (no dedicated DB column yet). */
export function extractPackSize(
  product: Pick<Product, 'name' | 'description'>
): string | null {
  for (const text of [product.name, product.description ?? '']) {
    const match = text.match(PACK_SIZE_RE)
    if (match?.[1]) return match[1].replace(/\s+/g, ' ').trim()
  }
  return null
}
