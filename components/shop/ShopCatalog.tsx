import Link from 'next/link'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { ProductCard } from '@/components/ProductCard'
import {
  ActiveFilterChips,
  ShopFiltersBar,
  ShopFiltersSidebar,
  SortMenu,
} from '@/components/shop/ShopFilters'
import { FashionDeptStrip } from '@/components/shop/FashionDeptStrip'
import {
  fetchCategoryCounts,
  fetchDistinctBrands,
  fetchProductsForShop,
  type SortOption,
} from '@/lib/supabase/products'
import { RecentlyViewed } from '@/components/store/RecentlyViewed'
import { BackToTop } from '@/components/store/BackToTop'
import {
  FASHION_BRAND_LINES,
  fashionQueryCategories,
  isFashionCategory,
  type ShopDept,
} from '@/lib/constants/categories'
import type { Product } from '@/types'

const VALID_SORTS: SortOption[] = ['featured', 'newest', 'price-asc', 'price-desc', 'name-asc']

export type ShopCatalogParams = {
  q?: string
  category?: string
  brand?: string
  dietary?: string
  minPrice?: string
  maxPrice?: string
  inStock?: string
  sort?: string
}

export async function ShopCatalog({
  params,
  dept = null,
}: {
  params: ShopCatalogParams
  dept?: ShopDept | null
}) {
  const deptCategories = dept === 'fashion' ? fashionQueryCategories() : null
  const fashionHub = dept === 'fashion'

  // Drop invalid fashion category from the URL so chips match the grid.
  if (fashionHub && params.category && !isFashionCategory(params.category)) {
    const next = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (key === 'category' || value == null || value === '') continue
      next.set(key, value)
    }
    redirect(next.toString() ? `/fashion?${next.toString()}` : '/fashion')
  }

  const category = params.category
  const minN = params.minPrice ? parseFloat(params.minPrice) : NaN
  const maxN = params.maxPrice ? parseFloat(params.maxPrice) : NaN
  const sort = (VALID_SORTS as string[]).includes(params.sort ?? '')
    ? (params.sort as SortOption)
    : 'featured'

  const [{ products, errorMessage }, categoryCount, brands] = await Promise.all([
    fetchProductsForShop({
      q: params.q,
      category,
      categories: !category && deptCategories ? deptCategories : undefined,
      brand: params.brand,
      dietary: params.dietary,
      minPrice: Number.isNaN(minN) ? undefined : minN,
      maxPrice: Number.isNaN(maxN) ? undefined : maxN,
      inStockOnly: params.inStock === '1',
      sort,
    }),
    fetchCategoryCounts(),
    fetchDistinctBrands({
      categories: fashionHub ? deptCategories ?? undefined : undefined,
    }),
  ])

  const brandOptions = fashionHub
    ? Array.from(new Set([...FASHION_BRAND_LINES, ...brands])).sort((a, b) =>
        a.localeCompare(b)
      )
    : brands

  const title = category
    ? category
    : fashionHub
      ? 'Fashion'
      : params.brand
        ? params.brand
        : params.q
          ? `Results for "${params.q}"`
          : 'All products'
  const subtitle = category
    ? fashionHub
      ? category
      : `${products.length} product${products.length === 1 ? '' : 's'} in ${category.toLowerCase()}`
    : fashionHub
      ? 'Clothes, fabric & hair'
      : params.q
        ? `${products.length} match${products.length === 1 ? '' : 'es'}`
        : `${products.length} product${products.length === 1 ? '' : 's'} across all departments`

  const clearHref = fashionHub ? '/fashion' : '/shop'
  const fashionStockCount = fashionHub
    ? (deptCategories ?? []).reduce((sum, c) => sum + (categoryCount[c] ?? 0), 0)
    : 0
  // True empty department (no fashion SKUs in catalog), not just "filters matched nothing".
  const fashionDeptEmpty = fashionHub && fashionStockCount === 0 && !errorMessage
  const fashionFilterEmpty =
    fashionHub &&
    !fashionDeptEmpty &&
    products.length === 0 &&
    !errorMessage

  return (
    <>
      <div className="min-h-screen bg-white">
        <div className="border-b border-earth-200 bg-white">
          <div className="store-container py-6 sm:py-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-earth-500">
                  {fashionHub ? 'Department' : 'Shop'}
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-earth-900 sm:text-3xl">
                  {title}
                </h1>
                {!fashionHub && (
                  <p className="mt-1.5 text-base font-semibold tabular-nums text-earth-900">
                    {subtitle}
                  </p>
                )}
                {fashionHub && (
                  <p className="mt-2 text-sm text-earth-600">
                    Clothes, fabric &amp; hair ·{' '}
                    <Link
                      href="/shop"
                      className="font-semibold text-brand-700 no-underline hover:underline"
                    >
                      Shop groceries
                    </Link>
                  </p>
                )}
                {fashionHub && fashionDeptEmpty && (
                  <p className="mt-1.5 text-base font-semibold text-earth-900">Coming soon</p>
                )}
              </div>
              {!fashionDeptEmpty && (
                <div className="hidden lg:block">
                  <Suspense fallback={null}>
                    <SortMenu />
                  </Suspense>
                </div>
              )}
            </div>
            {fashionHub && !fashionDeptEmpty && (
              <div className="mt-6">
                <FashionDeptStrip
                  activeCategory={category ?? null}
                  categoryCount={categoryCount}
                />
              </div>
            )}
          </div>
        </div>

        <div className="store-container py-6 sm:py-8 lg:py-10">
          {fashionDeptEmpty ? (
            <div className="rounded-xl border border-dashed border-earth-300 bg-earth-50 px-6 py-16 text-center">
              <p className="text-base font-semibold text-earth-900">Fashion coming soon</p>
              <p className="mt-1 text-sm text-earth-600">
                Prints, lace, ready-to-wear &amp; hair will show here when in stock.
              </p>
              <Link
                href="/shop"
                className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white no-underline hover:bg-brand-700"
              >
                Shop groceries
              </Link>
            </div>
          ) : (
          <div className="md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
            <aside className="hidden md:block">
              <div className="sticky top-24">
                <Suspense fallback={<p className="muted">Loading filters…</p>}>
                  <ShopFiltersSidebar categoryCount={categoryCount} brands={brandOptions} />
                </Suspense>
              </div>
            </aside>

            <div>
              <div className="sticky top-14 z-40 -mx-4 border-b border-earth-200 bg-white/95 px-4 py-2.5 backdrop-blur-sm sm:top-16 md:hidden lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
                <Suspense fallback={null}>
                  <ShopFiltersBar categoryCount={categoryCount} brands={brandOptions} />
                </Suspense>
              </div>

              <Suspense fallback={null}>
                <div className="mt-3 lg:mt-4">
                  <ActiveFilterChips />
                </div>
              </Suspense>

              {errorMessage && (
                <p className="error mt-4">
                  {errorMessage} <Link href={clearHref}>Reload</Link>
                </p>
              )}

              {products.length === 0 && !errorMessage ? (
                <div className="mt-8 rounded-xl border border-dashed border-earth-300 bg-earth-50 px-6 py-16 text-center">
                  <p className="text-base font-semibold text-earth-900">No products found</p>
                  <p className="mt-1 text-sm text-earth-600">
                    {fashionFilterEmpty
                      ? 'Try another fashion category or clear filters.'
                      : 'Try a different category or remove some filters.'}
                  </p>
                  <Link
                    href={clearHref}
                    className="mt-4 inline-block text-sm font-semibold text-brand-700 no-underline hover:underline"
                  >
                    Clear all filters →
                  </Link>
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                  {products.map((product: Product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      </div>
      <RecentlyViewed />
      <BackToTop />
    </>
  )
}
