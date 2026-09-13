import { createCatalogClient } from '@/lib/supabase/catalog-client'
import { filterStorefrontProducts } from '@/lib/catalog/public-product-filter'
import type { Product } from '@/types'

export type ProductBundle = {
  id: string
  slug: string
  name: string
  description: string | null
  image_url: string | null
  discount_percent: number
  items: Array<{ product: Product; quantity: number }>
}

export async function fetchActiveBundles(): Promise<ProductBundle[]> {
  try {
    const supabase = createCatalogClient()
    if (!supabase) return []
    const { data: bundles, error } = await supabase
      .from('product_bundles')
      .select('id, slug, name, description, image_url, discount_percent, sort_order')
      .eq('active', true)
      .order('sort_order', { ascending: true })
    if (error || !bundles?.length) return []

    const ids = bundles.map((b) => b.id as string)
    const { data: rows } = await supabase
      .from('product_bundle_items')
      .select('bundle_id, product_id, quantity')
      .in('bundle_id', ids)

    const productIds = [...new Set((rows ?? []).map((r) => r.product_id as string).filter(Boolean))]
    const { data: products } = productIds.length
      ? await supabase.from('products').select('*').in('id', productIds)
      : { data: [] }

    const productMap = new Map(
      filterStorefrontProducts((products ?? []) as Product[]).map((p) => [p.id, p])
    )

    return bundles
      .map((b) => {
        const items = (rows ?? [])
          .filter((r) => r.bundle_id === b.id)
          .map((r) => {
            const product = productMap.get(r.product_id as string)
            if (!product) return null
            return { product, quantity: Number(r.quantity ?? 1) || 1 }
          })
          .filter((x): x is { product: Product; quantity: number } => Boolean(x))
        return {
          id: b.id as string,
          slug: String(b.slug),
          name: String(b.name),
          description: (b.description as string | null) ?? null,
          image_url: (b.image_url as string | null) ?? null,
          discount_percent: Number(b.discount_percent ?? 0),
          items,
        }
      })
      .filter((b) => b.items.length > 0)
  } catch {
    return []
  }
}

export async function fetchBundleBySlug(slug: string): Promise<ProductBundle | null> {
  const all = await fetchActiveBundles()
  return all.find((b) => b.slug === slug) ?? null
}
