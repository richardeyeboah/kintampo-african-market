import { createClientOptional } from '@/lib/supabase/server'
import { getSupabasePublicConfig } from '@/lib/supabase/config'

export type HomepageReview = {
  id: string
  rating: number
  comment: string
  reviewer_name: string
  product_id: string
  product_name: string
}

function reviewProductName(
  products: { name: string } | { name: string }[] | null
): string | null {
  if (!products) return null
  if (Array.isArray(products)) return products[0]?.name ?? null
  return products.name
}

export async function fetchHomepageReviews(limit = 3): Promise<{
  reviews: HomepageReview[]
  totalCount: number
  averageRating: number
}> {
  const empty = { reviews: [], totalCount: 0, averageRating: 0 }
  const { configured } = getSupabasePublicConfig()
  if (!configured) return empty

  const supabase = await createClientOptional()
  if (!supabase) return empty

  const [featuredRes, statsRes] = await Promise.all([
    supabase
      .from('product_reviews')
      .select('id, product_id, reviewer_name, rating, comment, created_at, products(name)')
      .eq('approved', true)
      .not('comment', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase.from('product_reviews').select('rating').eq('approved', true),
  ])

  const stats = statsRes.data ?? []
  const totalCount = stats.length
  const averageRating =
    totalCount > 0
      ? stats.reduce((sum, r) => sum + (r.rating ?? 0), 0) / totalCount
      : 0

  const reviews: HomepageReview[] = (featuredRes.data ?? [])
    .map((row) => {
      const comment = row.comment?.trim()
      if (!comment) return null
      const product_name = reviewProductName(
        row.products as { name: string } | { name: string }[] | null
      )
      if (!product_name) return null
      return {
        id: row.id,
        rating: row.rating,
        comment,
        reviewer_name: row.reviewer_name,
        product_id: row.product_id,
        product_name,
      }
    })
    .filter((r): r is HomepageReview => r !== null)

  return { reviews, totalCount, averageRating }
}
