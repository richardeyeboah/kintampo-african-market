import { CANONICAL_SITE_URL } from '@/lib/site-url'

const PRODUCT_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Public product path only — never admin, cart, or current window URL. */
export function getPublicProductPath(productId: string): string {
  const id = productId.trim()
  if (!PRODUCT_ID_RE.test(id)) {
    throw new Error('Invalid product id')
  }
  return `/products/${id}`
}

/**
 * Absolute storefront product URL for sharing.
 * Prefer NEXT_PUBLIC_SITE_URL / canonical domain so friends never get
 * localhost, preview, or admin host links.
 */
export function getPublicProductUrl(productId: string): string {
  const path = getPublicProductPath(productId)
  const configured =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SITE_URL?.trim()) || ''
  const base = (configured || CANONICAL_SITE_URL).replace(/\/$/, '')
  return `${base}${path}`
}
