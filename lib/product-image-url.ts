/**
 * Serve product photos from same origin so CSP `img-src 'self'` always allows them.
 * Vercel / Next rewrites `/media/product-images/*` → Supabase public storage.
 */

const PUBLIC_MARKER = '/storage/v1/object/public/product-images/'

export function toStorefrontImageUrl(src: string | null | undefined): string | null {
  if (!src?.trim()) return null
  const raw = src.trim()

  try {
    const url = new URL(raw)
    const marker = url.pathname.indexOf(PUBLIC_MARKER)
    if (marker >= 0) {
      const path = url.pathname.slice(marker + PUBLIC_MARKER.length)
      return `/media/product-images/${path}${url.search}`
    }
  } catch {
    /* relative / invalid — return as-is */
  }

  return raw
}
