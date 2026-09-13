export const revalidate = 60 // Refresh homepage data every 60 seconds — keeps stock status current

import Link from 'next/link'
import { HeroSection } from '@/components/store/HeroSection'
import { TrustStrip } from '@/components/store/TrustStrip'
import { CategoryBrowse } from '@/components/store/CategoryBrowse'
import { FeaturedCollections } from '@/components/store/FeaturedCollections'
import { ProductShowcase } from '@/components/store/ProductShowcase'
import { RecentlyViewed } from '@/components/store/RecentlyViewed'
import { VisitSection } from '@/components/store/VisitSection'
import { AdditionalServices } from '@/components/store/AdditionalServices'
import { HomepageReviews } from '@/components/store/HomepageReviews'
import { BundleCard } from '@/components/store/BundleCard'
import { PRODUCT_CATEGORIES, fashionQueryCategories } from '@/lib/constants/categories'
import { fetchHomepageProducts, fetchFashionProducts } from '@/lib/supabase/products'
import { fetchBestsellers } from '@/lib/supabase/bestsellers'
import { fetchHomepageReviews } from '@/lib/supabase/homepage-reviews'
import { fetchActiveBundles } from '@/lib/supabase/bundles'

const HOME_CATEGORY_ORDER = [
  'Flours & Rice',
  'Fresh Produce',
  'Beverages',
  'Meat and Seafood',
  'Spices',
  'Ready-to-wear',
  'African Prints',
  'Lace',
  'Headtie',
  'Kente',
  'Brocade',
  'Hair & Braiding',
  'Dairy And Tea',
  'Bread',
  'Snack',
  'Canned',
  'Cosmetics',
] as const

export default async function Home() {
  const [
    { staples, trending, newArrivals, categoryCount, inStockCount, errorMessage },
    bestsellers,
    bundles,
    reviewData,
    fashion,
  ] = await Promise.all([
    fetchHomepageProducts(),
    fetchBestsellers(8),
    fetchActiveBundles(),
    fetchHomepageReviews(),
    fetchFashionProducts(8),
  ])
  const { reviews, totalCount: reviewCount, averageRating } = reviewData

  const withStock = PRODUCT_CATEGORIES.filter((c) => (categoryCount[c] ?? 0) > 0)
  const fashionCount = fashionQueryCategories().reduce(
    (sum, c) => sum + (categoryCount[c] ?? 0),
    0
  )
  const ordered = HOME_CATEGORY_ORDER.filter((c) => (categoryCount[c] ?? 0) > 0)
  const rest = withStock.filter((c) => !(HOME_CATEGORY_ORDER as readonly string[]).includes(c))
  const displayCategories =
    ordered.length > 0 ? [...ordered, ...rest].slice(0, 12) : PRODUCT_CATEGORIES.slice(0, 12)

  return (
    <>
      <HeroSection
        inStockCount={inStockCount}
        departmentCount={withStock.length}
        categoryCount={categoryCount}
        showFashion={fashionCount > 0}
      />
      <CategoryBrowse
        displayCategories={displayCategories}
        categoryCount={categoryCount}
        fashionCount={fashionCount}
      />
      {fashion.length > 0 && (
        <ProductShowcase
          title="Fashion & fabric"
          subtitle="Prints, lace, ready-to-wear & hair."
          products={fashion}
          viewAllHref="/fashion"
          priorityCount={2}
        />
      )}
      {staples.length > 0 && (
        <ProductShowcase
          title="Yam, fufu & staples"
          subtitle="Plantain, fufu flour, yam box & pantry essentials."
          products={staples}
          errorMessage={errorMessage}
          viewAllHref="/shop?category=Flours%20%26%20Rice"
          priorityCount={4}
        />
      )}
      {bestsellers.length > 0 && (
        <ProductShowcase
          title="Bestsellers"
          subtitle="Most ordered items from real checkout data."
          products={bestsellers}
          viewAllHref="/shop?sort=featured"
          priorityCount={2}
        />
      )}
      {newArrivals.length > 0 && (
        <ProductShowcase
          title="New arrivals"
          subtitle="Recently added to the catalog."
          products={newArrivals}
          viewAllHref="/shop?sort=newest"
          priorityCount={2}
        />
      )}
      {trending.length > 0 && (
        <ProductShowcase
          title="Trending this week"
          subtitle="Popular across departments — drinks, spices, snacks & more."
          products={trending}
          errorMessage={errorMessage}
          priorityCount={2}
        />
      )}
      {bundles.length > 0 && (
        <section className="border-t border-earth-100 bg-earth-50 py-12 sm:py-16 lg:py-20">
          <div className="store-container">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-earth-500">
                  Kits
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight text-earth-900 sm:text-xl">
                  Meal sets
                </h2>
                <p className="mt-1 text-sm text-earth-600">Full set, one add to cart.</p>
              </div>
              <Link
                href="/bundles"
                className="text-sm font-semibold text-brand-700 no-underline hover:text-brand-800"
              >
                View all
              </Link>
            </div>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {bundles.slice(0, 3).map((bundle) => (
                <li key={bundle.id}>
                  <BundleCard bundle={bundle} quiet />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      <FeaturedCollections showFashion={fashionCount > 0} />
      <RecentlyViewed />
      <TrustStrip inStockCount={inStockCount} />
      <HomepageReviews reviews={reviews} totalCount={reviewCount} averageRating={averageRating} />
      <AdditionalServices />
      <VisitSection />
    </>
  )
}
