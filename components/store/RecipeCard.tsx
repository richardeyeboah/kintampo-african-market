import Link from 'next/link'
import Image from 'next/image'
import { ProductImage } from '@/components/store/ProductImage'
import { recipeFallbackImage } from '@/lib/recipes/fallback'
import type { Recipe } from '@/lib/supabase/recipes'

/** Recipe card with dominant image (or ingredient thumbs / store photo fallback). */
export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const timing = [
    recipe.prep_minutes != null ? `${recipe.prep_minutes} min prep` : null,
    recipe.cook_minutes != null ? `${recipe.cook_minutes} min cook` : null,
    recipe.servings != null ? `${recipe.servings} servings` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const linked = recipe.ingredients.filter((i) => i.product?.image_url).slice(0, 4)
  const hero = recipe.image_url?.trim() || null
  const fallback = recipeFallbackImage(recipe.slug)

  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className="premium-card premium-card-hover group flex h-full flex-col overflow-hidden no-underline"
    >
      <div className="relative aspect-[16/10] bg-earth-100">
        {hero ? (
          <Image
            src={hero}
            alt=""
            fill
            sizes="(max-width:640px) 100vw, 33vw"
            className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          />
        ) : linked.length > 0 ? (
          <div className="grid h-full grid-cols-2 grid-rows-2 gap-px bg-earth-200">
            {linked.map((ing) => (
              <div key={ing.id} className="relative bg-white">
                <ProductImage
                  src={ing.product!.image_url}
                  alt={ing.label}
                  className="h-full w-full rounded-none"
                  sizes="160px"
                  framed={false}
                />
              </div>
            ))}
            {Array.from({ length: Math.max(0, 4 - linked.length) }).map((_, i) => (
              <div key={`pad-${i}`} className="bg-earth-50" aria-hidden />
            ))}
          </div>
        ) : (
          <>
            <Image
              src={fallback}
              alt=""
              fill
              sizes="(max-width:640px) 100vw, 33vw"
              className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
              unoptimized={fallback.startsWith('/images/')}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-earth-950/55 via-earth-950/10 to-transparent" />
            <p className="absolute bottom-3 left-3 right-3 text-sm font-semibold text-white drop-shadow">
              {recipe.title}
            </p>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h2 className="text-[15px] font-semibold leading-snug text-earth-900">{recipe.title}</h2>
        {recipe.summary && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-earth-600">{recipe.summary}</p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-4 text-xs text-earth-500">
          {timing && <span>{timing}</span>}
          <span className="font-medium text-earth-700">
            {recipe.ingredients.length} ingredient
            {recipe.ingredients.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>
    </Link>
  )
}
