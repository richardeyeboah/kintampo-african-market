import type { MetadataRoute } from 'next'
import { createCatalogClient } from '@/lib/supabase/catalog-client'
import { getPublicSiteUrl } from '@/lib/site-url'
import { isHiddenFromStorefront } from '@/lib/catalog/public-product-filter'
import { isFashionCategory } from '@/lib/constants/categories'

/**
 * /sitemap.xml — generated at request time so newly added/removed products show up
 * without a redeploy. Excludes auth-gated and admin routes (those have noindex implicitly
 * via robots.ts disallow + auth redirects, and we don't want them in search anyway).
 */
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getPublicSiteUrl()
  const now = new Date()

  // Only public, indexable pages (matches disallow rules in robots.ts).
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/shop`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/feedback`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ]

  let productEntries: MetadataRoute.Sitemap = []
  try {
    const supabase = createCatalogClient()
    if (!supabase) return staticEntries

    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, category, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    type ProductSitemapRow = {
      id: string
      name: string | null
      category: string | null
      created_at: string | null
    }

    const visible =
      (products as ProductSitemapRow[] | null)?.filter((p) => !isHiddenFromStorefront(p)) ?? []

    productEntries = visible.map((p) => ({
      url: `${baseUrl}/products/${p.id}`,
      lastModified: p.created_at ? new Date(p.created_at) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    // De-duplicate category landing pages. Fashion cats use /fashion hub URLs.
    const categories = new Set<string>()
    visible.forEach((p) => {
      if (p.category) categories.add(p.category)
    })
    const hasFashion = [...categories].some((c) => isFashionCategory(c))
    if (hasFashion) {
      productEntries.push({
        url: `${baseUrl}/fashion`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.85,
      })
    }
    for (const category of categories) {
      const url = isFashionCategory(category)
        ? `${baseUrl}/fashion?category=${encodeURIComponent(category)}`
        : `${baseUrl}/shop?category=${encodeURIComponent(category)}`
      productEntries.push({
        url,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }
  } catch (err) {
    // If supabase is unreachable during build, still return static pages so the sitemap
    // doesn't 500 in production.
    console.error('[sitemap] failed to load products:', err)
  }

  return [...staticEntries, ...productEntries]
}
