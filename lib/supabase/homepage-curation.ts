import type { Product } from '@/types'
import type { SupabaseClient } from '@supabase/supabase-js'
import { filterStorefrontProducts, isHiddenFromStorefront } from '@/lib/catalog/public-product-filter'

const PRODUCT_SELECT = 'id,name,price,image_url,category,in_stock,description,created_at'

/** Must appear on homepage — pinned before general trending */
const STAPLE_PINS: { label: string; patterns: string[]; limit: number }[] = [
  { label: 'fufu', patterns: ['fufu', 'fufuf'], limit: 3 },
  { label: 'yam', patterns: ['yam'], limit: 1 },
  { label: 'plantain', patterns: ['plantain'], limit: 2 },
]

/** Curated “Trending this week” — grocery staples first, cosmetics capped */
const TRENDING_SLOTS: {
  category: string
  limit: number
  keywords?: string[]
}[] = [
  { category: 'Flours & Rice', limit: 2, keywords: ['gari', 'banku', 'rice', 'konkonte'] },
  { category: 'Fresh Produce', limit: 1, keywords: ['okra', 'ugwu', 'spinach'] },
  { category: 'Beverages', limit: 1 },
  { category: 'Spices', limit: 1 },
  { category: 'Snack', limit: 1 },
  { category: 'Meat and Seafood', limit: 1 },
  { category: 'Bread', limit: 1 },
  { category: 'Cosmetics', limit: 1 },
]

function nameMatchesKeywords(name: string, keywords: string[]): boolean {
  const n = name.toLowerCase()
  return keywords.some((k) => n.includes(k))
}

function nameMatchesPatterns(name: string, patterns: string[]): boolean {
  const n = name.toLowerCase()
  return patterns.some((p) => n.includes(p))
}

function pickFromRows(rows: Product[], limit: number, keywords?: string[]): Product[] {
  const withImage = rows.filter((p) => p.image_url?.trim())
  const pool = keywords?.length
    ? [...withImage.filter((p) => nameMatchesKeywords(p.name, keywords)), ...withImage]
    : withImage
  const seen = new Set<string>()
  const out: Product[] = []
  for (const p of pool) {
    if (seen.has(p.id)) continue
    seen.add(p.id)
    out.push(p)
    if (out.length >= limit) break
  }
  return out
}

async function fetchStapleShowcase(supabase: SupabaseClient): Promise<Product[]> {
  const out: Product[] = []
  const used = new Set<string>()

  for (const pin of STAPLE_PINS) {
    const orFilter = pin.patterns.map((p) => `name.ilike.%${p}%`).join(',')
    const { data } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('in_stock', true)
      .or(orFilter)
      .order('created_at', { ascending: false })
      .limit(32)

    const rows = filterStorefrontProducts((data ?? []) as Product[]).sort((a, b) => {
      const aImg = a.image_url?.trim() ? 1 : 0
      const bImg = b.image_url?.trim() ? 1 : 0
      if (bImg !== aImg) return bImg - aImg
      const aMatch = nameMatchesPatterns(a.name, pin.patterns) ? 1 : 0
      const bMatch = nameMatchesPatterns(b.name, pin.patterns) ? 1 : 0
      return bMatch - aMatch
    })

    let added = 0
    for (const p of rows) {
      if (used.has(p.id)) continue
      if (!nameMatchesPatterns(p.name, pin.patterns)) continue
      used.add(p.id)
      out.push(p)
      added++
      if (added >= pin.limit) break
    }
  }

  return out
}

export async function fetchCuratedHomepageShowcase(
  supabase: SupabaseClient
): Promise<{ staples: Product[]; trending: Product[]; newArrivals: Product[] }> {
  const staples = await fetchStapleShowcase(supabase)
  const used = new Set(staples.map((p) => p.id))

  const slotResults = await Promise.all(
    TRENDING_SLOTS.map(async (slot) => {
      const { data } = await supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .eq('in_stock', true)
        .eq('category', slot.category)
        .order('created_at', { ascending: false })
        .limit(24)
      return pickFromRows(
        filterStorefrontProducts((data ?? []) as Product[]),
        slot.limit,
        slot.keywords
      )
    })
  )

  const trending: Product[] = []
  for (const batch of slotResults) {
    for (const p of batch) {
      if (used.has(p.id)) continue
      used.add(p.id)
      trending.push(p)
    }
  }

  const trendingTarget = 8
  if (trending.length < trendingTarget) {
    const { data: fill } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('in_stock', true)
      .neq('category', 'Cosmetics')
      .not('image_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(24)

    for (const p of filterStorefrontProducts((fill ?? []) as Product[])) {
      if (used.has(p.id)) continue
      if (!p.image_url?.trim()) continue
      used.add(p.id)
      trending.push(p)
      if (trending.length >= trendingTarget) break
    }
  }

  const { data: newest } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('in_stock', true)
    .not('image_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(32)

  const newArrivals: Product[] = []
  for (const p of filterStorefrontProducts((newest ?? []) as Product[])) {
    if (used.has(p.id)) continue
    if (!p.image_url?.trim()) continue
    if (isHiddenFromStorefront(p)) continue
    used.add(p.id)
    newArrivals.push(p)
    if (newArrivals.length >= 4) break
  }

  return {
    staples,
    trending: trending.slice(0, trendingTarget),
    newArrivals,
  }
}
