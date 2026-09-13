import type { Metadata } from 'next'
import { PageHeader } from '@/components/store/PageHeader'
import { RecipeCard } from '@/components/store/RecipeCard'
import { fetchRecipes } from '@/lib/supabase/recipes'

export const metadata: Metadata = {
  title: 'Recipes',
  description: 'Recipes with ingredients you can add to cart.',
}

export const revalidate = 60

export default async function RecipesPage() {
  const recipes = await fetchRecipes()

  return (
    <div className="min-h-screen bg-white">
      <PageHeader
        title="Recipes"
        subtitle="Add linked ingredients to cart in one tap."
      />
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="store-container">
          {recipes.length === 0 ? (
            <p className="py-12 text-center text-sm text-earth-500">No recipes yet.</p>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {recipes.map((recipe) => (
                <li key={recipe.id}>
                  <RecipeCard recipe={recipe} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
