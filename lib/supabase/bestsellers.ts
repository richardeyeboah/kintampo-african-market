import { supabaseAdmin } from '@/lib/supabase-admin'
import { filterStorefrontProducts } from '@/lib/catalog/public-product-filter'
import type { Product } from '@/types'

/** Top sellers by units from recent order_items (server-only). */
export async function fetchBestsellers(limit = 8): Promise<Product[]> {
  try {
    const { data: rows, error } = await supabaseAdmin
      .from('order_items')
      .select('product_id, quantity')
      .not('product_id', 'is', null)
      .limit(2000)

    if (error || !rows?.length) return []

    const units = new Map<string, number>()
    for (const row of rows) {
      const id = row.product_id as string
      const qty = Number(row.quantity ?? 0)
      if (!id || !Number.isFinite(qty)) continue
      units.set(id, (units.get(id) ?? 0) + qty)
    }

    const topIds = [...units.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit * 2)
      .map(([id]) => id)

    if (!topIds.length) return []

    const { data: products } = await supabaseAdmin
      .from('products')
      .select('*')
      .in('id', topIds)
      .eq('in_stock', true)

    const byId = new Map(((products ?? []) as Product[]).map((p) => [p.id, p]))
    const ordered = topIds
      .map((id) => byId.get(id))
      .filter((p): p is Product => Boolean(p))

    return filterStorefrontProducts(ordered).slice(0, limit)
  } catch {
    return []
  }
}
