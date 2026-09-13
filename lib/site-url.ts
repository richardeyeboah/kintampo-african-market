/** Production domain — used when NEXT_PUBLIC_SITE_URL is unset on Vercel (sitemap, robots, JSON-LD). */
export const CANONICAL_SITE_URL = 'https://kintampoafricanmarket.com'

/** Canonical public URL for redirects and emails (no trailing slash). */
export function getPublicSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, '')
  if (process.env.VERCEL_ENV === 'production') {
    return CANONICAL_SITE_URL
  }
  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '')}`
  return 'http://localhost:3000'
}
