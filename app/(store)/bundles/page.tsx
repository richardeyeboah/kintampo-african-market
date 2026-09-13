import type { Metadata } from 'next'
import { PageHeader } from '@/components/store/PageHeader'
import { BundleCard } from '@/components/store/BundleCard'
import { fetchActiveBundles } from '@/lib/supabase/bundles'

export const metadata: Metadata = {
  title: 'Kits & Bundles',
  description: 'Meal kits and product bundles — add the full set in one tap.',
}

export const revalidate = 60

export default async function BundlesPage() {
  const bundles = await fetchActiveBundles()

  return (
    <div className="min-h-screen bg-white">
      <PageHeader
        title="Kits & bundles"
        subtitle="Full set, one add to cart. Price shown after kit discount."
      />
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="store-container">
          {bundles.length === 0 ? (
            <p className="py-12 text-center text-sm text-earth-500">No kits available right now.</p>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {bundles.map((bundle) => (
                <li key={bundle.id}>
                  <BundleCard bundle={bundle} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
