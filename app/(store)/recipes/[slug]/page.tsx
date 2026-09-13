import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/store/PageHeader'
import { AddRecipeToCart } from '@/components/store/AddRecipeToCart'
import { ProductImage } from '@/components/store/ProductImage'
import { recipeFallbackImage } from '@/lib/recipes/fallback'
import { fetchRecipeBySlug, fetchRecipes } from '@/lib/supabase/recipes'

export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const recipe = await fetchRecipeBySlug(slug)
  if (!recipe) return { title: 'Recipe not found', robots: { index: false } }
  return {
    title: recipe.title,
    description: recipe.summary ?? `${recipe.title} — ingredients from the store.`,
  }
}

export async function generateStaticParams() {
  const recipes = await fetchRecipes()
  return recipes.map((r) => ({ slug: r.slug }))
}

function bodyParagraphs(body: string): string[] {
  return body
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => p.replace(/^##\s+/, '').replace(/^#\s+/, ''))
}

export default async function RecipeDetailPage({ params }: Props) {
  const { slug } = await params
  const recipe = await fetchRecipeBySlug(slug)
  if (!recipe) notFound()

  const timing = [
    recipe.prep_minutes != null ? `${recipe.prep_minutes} min prep` : null,
    recipe.cook_minutes != null ? `${recipe.cook_minutes} min cook` : null,
    recipe.servings != null ? `${recipe.servings} servings` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const paragraphs = bodyParagraphs(recipe.body_md)
  const cartIngredients = recipe.ingredients
    .filter((i) => i.product)
    .map((i) => ({
      product: i.product!,
      quantity: i.quantity,
    }))
  const linkedThumbs = recipe.ingredients.filter((i) => i.product?.image_url).slice(0, 4)
  const hero = recipe.image_url?.trim() || null
  const fallback = recipeFallbackImage(recipe.slug)

  return (
    <div className="min-h-screen bg-white">
      <PageHeader title={recipe.title} subtitle={recipe.summary ?? undefined} />
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="store-container grid gap-8 lg:grid-cols-[1fr_340px] lg:gap-12">
          <div>
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-earth-200 bg-earth-100">
              {hero ? (
                <Image
                  src={hero}
                  alt=""
                  fill
                  priority
                  sizes="(max-width:1024px) 100vw, 70vw"
                  className="object-cover"
                />
              ) : linkedThumbs.length > 0 ? (
                <div className="grid h-full grid-cols-2 grid-rows-2 gap-px bg-earth-200">
                  {linkedThumbs.map((ing) => (
                    <div key={ing.id} className="relative bg-white">
                      <ProductImage
                        src={ing.product!.image_url}
                        alt={ing.label}
                        className="h-full w-full rounded-none"
                        sizes="300px"
                        framed={false}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <Image
                  src={fallback}
                  alt=""
                  fill
                  priority
                  sizes="(max-width:1024px) 100vw, 70vw"
                  className="object-cover"
                  unoptimized={fallback.startsWith('/images/')}
                />
              )}
            </div>

            {timing && <p className="mt-4 text-sm text-earth-500">{timing}</p>}

            {paragraphs.length > 0 && (
              <div className="mt-8 space-y-4 text-base leading-relaxed text-earth-700">
                {paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-earth-200 bg-earth-50 p-5 sm:p-6">
              <h2 className="text-base font-semibold text-earth-900">Ingredients</h2>
              <ul className="mt-4 space-y-3">
                {recipe.ingredients.map((ing) => (
                  <li key={ing.id} className="flex items-center gap-3 text-sm">
                    {ing.product?.image_url ? (
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-earth-200 bg-white">
                        <ProductImage
                          src={ing.product.image_url}
                          alt={ing.label}
                          className="h-full w-full rounded-none"
                          sizes="44px"
                          framed={false}
                        />
                      </div>
                    ) : (
                      <div className="h-11 w-11 shrink-0 rounded-lg border border-earth-200 bg-white" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-earth-900">
                        {ing.quantity > 1 ? `${ing.quantity}× ` : ''}
                        {ing.label}
                      </p>
                      {ing.product && (
                        <Link
                          href={`/products/${ing.product.id}`}
                          className="inline-flex min-h-11 items-center text-xs font-medium text-brand-700 no-underline hover:text-brand-800"
                        >
                          View product
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <AddRecipeToCart recipeTitle={recipe.title} ingredients={cartIngredients} />
              </div>
            </div>
            <p className="mt-6">
              <Link
                href="/recipes"
                className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-700 no-underline hover:text-brand-800"
              >
                ← All recipes
              </Link>
            </p>
          </aside>
        </div>
      </section>
    </div>
  )
}
