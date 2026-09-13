import { createCatalogClient } from '@/lib/supabase/catalog-client'
import { filterStorefrontProducts } from '@/lib/catalog/public-product-filter'
import type { Product } from '@/types'

export type RecipeIngredient = {
  id: string
  label: string
  quantity: number
  product: Product | null
}

export type Recipe = {
  id: string
  slug: string
  title: string
  summary: string | null
  body_md: string
  image_url: string | null
  prep_minutes: number | null
  cook_minutes: number | null
  servings: number | null
  ingredients: RecipeIngredient[]
}

export async function fetchRecipes(): Promise<Recipe[]> {
  try {
    const supabase = createCatalogClient()
    if (!supabase) return []
    const { data, error } = await supabase
      .from('recipes')
      .select('id, slug, title, summary, body_md, image_url, prep_minutes, cook_minutes, servings, sort_order')
      .eq('active', true)
      .order('sort_order', { ascending: true })
    if (error || !data?.length) return []

    const recipes: Recipe[] = []
    for (const row of data) {
      const full = await hydrateRecipe(supabase, row)
      if (full) recipes.push(full)
    }
    return recipes
  } catch {
    return []
  }
}

export async function fetchRecipeBySlug(slug: string): Promise<Recipe | null> {
  try {
    const supabase = createCatalogClient()
    if (!supabase) return null
    const { data, error } = await supabase
      .from('recipes')
      .select('id, slug, title, summary, body_md, image_url, prep_minutes, cook_minutes, servings')
      .eq('slug', slug)
      .eq('active', true)
      .maybeSingle()
    if (error || !data) return null
    return hydrateRecipe(supabase, data)
  } catch {
    return null
  }
}

async function hydrateRecipe(
  supabase: NonNullable<ReturnType<typeof createCatalogClient>>,
  row: Record<string, unknown>
): Promise<Recipe | null> {
  const { data: ingredients } = await supabase
    .from('recipe_ingredients')
    .select('id, label, quantity, product_id, sort_order')
    .eq('recipe_id', row.id as string)
    .order('sort_order', { ascending: true })

  const productIds = [...new Set((ingredients ?? []).map((i) => i.product_id).filter(Boolean))] as string[]
  const { data: products } = productIds.length
    ? await supabase.from('products').select('*').in('id', productIds)
    : { data: [] }
  const productMap = new Map(
    filterStorefrontProducts((products ?? []) as Product[]).map((p) => [p.id, p])
  )

  return {
    id: row.id as string,
    slug: String(row.slug),
    title: String(row.title),
    summary: (row.summary as string | null) ?? null,
    body_md: String(row.body_md ?? ''),
    image_url: (row.image_url as string | null) ?? null,
    prep_minutes: typeof row.prep_minutes === 'number' ? row.prep_minutes : null,
    cook_minutes: typeof row.cook_minutes === 'number' ? row.cook_minutes : null,
    servings: typeof row.servings === 'number' ? row.servings : null,
    ingredients: (ingredients ?? []).map((i) => ({
      id: i.id as string,
      label: String(i.label),
      quantity: Number(i.quantity ?? 1) || 1,
      product: i.product_id ? productMap.get(i.product_id as string) ?? null : null,
    })),
  }
}
