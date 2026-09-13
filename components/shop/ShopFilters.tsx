'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, Filter, X } from 'lucide-react'
import {
  FASHION_CATEGORIES,
  PRODUCT_CATEGORIES,
  parseShopDept,
} from '@/lib/constants/categories'
import { DIETARY_TAGS, DIETARY_TAG_LABEL } from '@/lib/orders/grocery-ops'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const SORT_LABELS: Record<string, string> = {
  featured: 'Featured',
  newest: 'Newest',
  'price-asc': 'Price: low → high',
  'price-desc': 'Price: high → low',
  'name-asc': 'Name: A → Z',
}

function useShopFilterState() {
  const router = useRouter()
  const sp = useSearchParams()
  const pathname = usePathname()
  const fashionHub =
    pathname === '/fashion' || parseShopDept(sp.get('dept')) === 'fashion'
  const catalogBase = fashionHub ? '/fashion' : '/shop'
  const [q, setQ] = useState(sp.get('q') ?? '')
  const [category, setCategory] = useState(sp.get('category') ?? '')
  const [brand, setBrand] = useState(sp.get('brand') ?? '')
  const [dietary, setDietary] = useState(sp.get('dietary') ?? '')
  const [minPrice, setMinPrice] = useState(sp.get('minPrice') ?? '')
  const [maxPrice, setMaxPrice] = useState(sp.get('maxPrice') ?? '')
  const [inStockOnly, setInStockOnly] = useState(sp.get('inStock') === '1')
  const [sort, setSort] = useState(sp.get('sort') ?? 'featured')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setQ(sp.get('q') ?? '')
    setCategory(sp.get('category') ?? '')
    setBrand(sp.get('brand') ?? '')
    setDietary(sp.get('dietary') ?? '')
    setMinPrice(sp.get('minPrice') ?? '')
    setMaxPrice(sp.get('maxPrice') ?? '')
    setInStockOnly(sp.get('inStock') === '1')
    setSort(sp.get('sort') ?? 'featured')
  }, [sp])

  const activeCategory = sp.get('category')

  const activeFilterCount = [
    sp.get('q') ? 1 : 0,
    sp.get('category') ? 1 : 0,
    sp.get('brand') ? 1 : 0,
    sp.get('dietary') ? 1 : 0,
    sp.get('minPrice') || sp.get('maxPrice') ? 1 : 0,
    sp.get('inStock') === '1' ? 1 : 0,
    sp.get('sort') && sp.get('sort') !== 'featured' ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  const hasFilters = activeFilterCount > 0
  const shopBase = catalogBase

  const pushFilters = useCallback(
    (next: Partial<{
      q: string
      category: string
      brand: string
      dietary: string
      minPrice: string
      maxPrice: string
      inStock: boolean
      sort: string
    }>) => {
      const p = new URLSearchParams()
      // /fashion already scopes the dept; keep ?dept=fashion only on /shop
      if (fashionHub && catalogBase === '/shop') p.set('dept', 'fashion')
      const qVal = next.q ?? q
      const catVal = next.category !== undefined ? next.category : category
      const brandVal = next.brand !== undefined ? next.brand : brand
      const dietaryVal = next.dietary !== undefined ? next.dietary : dietary
      const minVal = next.minPrice ?? minPrice
      const maxVal = next.maxPrice ?? maxPrice
      const stockVal = next.inStock ?? inStockOnly
      const sortVal = next.sort ?? sort
      if (qVal.trim()) p.set('q', qVal.trim())
      if (catVal) p.set('category', catVal)
      if (brandVal) p.set('brand', brandVal)
      if (dietaryVal) p.set('dietary', dietaryVal)
      if (minVal) p.set('minPrice', minVal)
      if (maxVal) p.set('maxPrice', maxVal)
      if (stockVal) p.set('inStock', '1')
      if (sortVal && sortVal !== 'featured') p.set('sort', sortVal)
      router.push(`${catalogBase}${p.toString() ? `?${p.toString()}` : ''}`, { scroll: false })
    },
    [router, fashionHub, catalogBase, q, category, brand, dietary, minPrice, maxPrice, inStockOnly, sort]
  )

  function apply(e?: React.FormEvent) {
    e?.preventDefault()
    pushFilters({})
    setMobileOpen(false)
  }

  function reset() {
    setQ('')
    setCategory('')
    setBrand('')
    setDietary('')
    setMinPrice('')
    setMaxPrice('')
    setInStockOnly(false)
    setSort('featured')
    router.push(shopBase, { scroll: false })
    setMobileOpen(false)
  }

  function setCategoryAndGo(cat: string) {
    setCategory(cat)
    pushFilters({ category: cat })
    setMobileOpen(false)
  }

  function setBrandAndGo(b: string) {
    setBrand(b)
    pushFilters({ brand: b })
    setMobileOpen(false)
  }

  function setDietaryAndGo(d: string) {
    setDietary(d)
    pushFilters({ dietary: d })
    setMobileOpen(false)
  }

  function setSortAndGo(s: string) {
    setSort(s)
    pushFilters({ sort: s })
  }

  function toggleStockAndGo(v: boolean) {
    setInStockOnly(v)
    pushFilters({ inStock: v })
  }

  return {
    q, setQ,
    category, setCategory,
    brand, setBrand,
    dietary, setDietary,
    minPrice, setMinPrice,
    maxPrice, setMaxPrice,
    inStockOnly, setInStockOnly,
    sort, setSort,
    mobileOpen, setMobileOpen,
    activeCategory,
    fashionHub,
    hasFilters,
    activeFilterCount,
    shopBase,
    apply, reset,
    setCategoryAndGo, setBrandAndGo, setDietaryAndGo, setSortAndGo, toggleStockAndGo,
  }
}

function categoryOptions(
  fashionHub: boolean,
  categoryCount?: Record<string, number>
): readonly string[] {
  const base = fashionHub ? [...FASHION_CATEGORIES] : [...PRODUCT_CATEGORIES]
  if (!categoryCount) return base
  return base
    .filter((c) => (categoryCount[c] ?? 0) > 0)
    .sort((a, b) => (categoryCount[b] ?? 0) - (categoryCount[a] ?? 0))
}

function PriceFields({
  minPrice,
  maxPrice,
  setMinPrice,
  setMaxPrice,
}: {
  minPrice: string
  maxPrice: string
  setMinPrice: (v: string) => void
  setMaxPrice: (v: string) => void
}) {
  const PRESETS = [
    { label: 'Under $10', min: '', max: '10' },
    { label: '$10 – $25', min: '10', max: '25' },
    { label: '$25 – $50', min: '25', max: '50' },
    { label: '$50+', min: '50', max: '' },
  ]

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="filter-min" className="form-label">
            Min $
          </label>
          <Input
            id="filter-min"
            type="number"
            min={0}
            step={0.01}
            placeholder="0"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="filter-max" className="form-label">
            Max $
          </label>
          <Input
            id="filter-max"
            type="number"
            min={0}
            step={0.01}
            placeholder="Any"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            className="rounded-full border border-earth-200 bg-white px-2.5 py-1 text-[11px] font-medium text-earth-700 transition-colors hover:border-earth-300 hover:bg-earth-50"
            onClick={() => {
              setMinPrice(p.min)
              setMaxPrice(p.max)
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function CategoryList({
  activeCategory,
  onSelect,
  categoryCount,
  fashionHub,
}: {
  activeCategory: string | null
  onSelect: (cat: string) => void
  categoryCount?: Record<string, number>
  fashionHub?: boolean
}) {
  const categories = categoryOptions(!!fashionHub, categoryCount)
  const allLabel = fashionHub ? 'All fashion' : 'All products'
  const allCount = fashionHub
    ? null
    : categoryCount
      ? Object.values(categoryCount).reduce((a, b) => a + b, 0)
      : null

  return (
    <ul className="space-y-0.5">
      <li>
        <button
          type="button"
          onClick={() => onSelect('')}
          className={cn(
            'flex min-h-11 w-full items-center justify-between gap-2 rounded-md px-2.5 py-2.5 text-left text-[13px] font-medium transition-colors duration-150',
            !activeCategory
              ? 'bg-earth-100 text-earth-900'
              : 'text-earth-700 hover:bg-earth-50 hover:text-earth-900'
          )}
        >
          <span>{allLabel}</span>
          {allCount != null && (
            <span className="text-[11px] tabular-nums text-earth-400">{allCount}</span>
          )}
        </button>
      </li>
      {categories.map((c) => (
        <li key={c}>
          <button
            type="button"
            onClick={() => onSelect(c)}
            className={cn(
              'flex min-h-11 w-full items-center justify-between gap-2 rounded-md px-2.5 py-2.5 text-left text-[13px] font-medium transition-colors duration-150',
              activeCategory === c
                ? 'bg-earth-100 text-earth-900'
                : 'text-earth-700 hover:bg-earth-50 hover:text-earth-900'
            )}
          >
            <span className="line-clamp-1 flex-1">{c}</span>
            {!fashionHub && categoryCount?.[c] != null && (
              <span className="shrink-0 text-[11px] tabular-nums text-earth-400">
                {categoryCount[c]}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  )
}

function StockToggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-md border border-earth-200 bg-white px-3 py-2.5 transition-colors hover:border-earth-300">
      <span className="text-sm font-medium text-earth-900">In stock only</span>
      <span
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-150',
          checked ? 'bg-brand-700' : 'bg-earth-200'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-150',
            checked ? 'translate-x-[18px]' : 'translate-x-0.5'
          )}
        />
        <input
          type="checkbox"
          className="absolute inset-0 cursor-pointer opacity-0"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-label="In stock only"
        />
      </span>
    </label>
  )
}

export function SortMenu() {
  const router = useRouter()
  const sp = useSearchParams()
  const pathname = usePathname()
  const fashionHub =
    pathname === '/fashion' || parseShopDept(sp.get('dept')) === 'fashion'
  const catalogBase = fashionHub ? '/fashion' : '/shop'
  const current = sp.get('sort') ?? 'featured'
  const [open, setOpen] = useState(false)

  function select(value: string) {
    const p = new URLSearchParams(sp.toString())
    p.delete('dept') // /fashion already scopes; avoid duplicate
    if (value === 'featured') p.delete('sort')
    else p.set('sort', value)
    if (fashionHub && catalogBase === '/shop') p.set('dept', 'fashion')
    router.push(`${catalogBase}${p.toString() ? `?${p.toString()}` : ''}`, { scroll: false })
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 min-h-11 w-full items-center justify-between gap-1.5 rounded-md border border-earth-200 bg-white px-3 text-sm font-medium text-earth-700 transition-colors hover:border-earth-300 hover:bg-earth-50 sm:w-auto sm:justify-start"
      >
        <span className="text-earth-500">Sort</span>
        <span className="truncate text-earth-900">{SORT_LABELS[current] ?? 'Featured'}</span>
        <ChevronDown className="h-3.5 w-3.5 text-earth-500" aria-hidden />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div className="animate-fade-in absolute right-0 top-[calc(100%+4px)] z-40 w-52 overflow-hidden rounded-md border border-earth-200 bg-white shadow-[var(--shadow-premium)]">
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => select(value)}
                className={cn(
                  'flex min-h-11 w-full items-center justify-between px-3 py-3 text-left text-sm transition-colors hover:bg-earth-50',
                  current === value
                    ? 'font-semibold text-earth-900'
                    : 'text-earth-700'
                )}
              >
                {label}
                {current === value && (
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-700" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function ShopFiltersSidebar({
  categoryCount,
  brands = [],
}: {
  categoryCount?: Record<string, number>
  brands?: string[]
}) {
  const state = useShopFilterState()

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-earth-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-earth-500">Filters</p>
          {state.hasFilters && (
            <button
              type="button"
              onClick={state.reset}
              className="text-xs font-medium text-brand-700 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>

        <form onSubmit={state.apply} className="mt-3 space-y-4">
          <StockToggle checked={state.inStockOnly} onChange={state.toggleStockAndGo} />

          <div>
            <p className="form-label mb-1.5">Price</p>
            <PriceFields
              minPrice={state.minPrice}
              maxPrice={state.maxPrice}
              setMinPrice={state.setMinPrice}
              setMaxPrice={state.setMaxPrice}
            />
            <Button type="submit" size="sm" className="mt-2 h-11 w-full text-xs">
              Apply price
            </Button>
          </div>

          {brands.length > 0 && (
            <div>
              <p className="form-label mb-1.5">
                {state.fashionHub ? 'Brand / line' : 'Brand'}
              </p>
              <ul className="max-h-40 space-y-0.5 overflow-y-auto">
                <li>
                  <button
                    type="button"
                    onClick={() => state.setBrandAndGo('')}
                    className={cn(
                      'flex min-h-10 w-full items-center rounded-md px-2.5 text-left text-[13px] font-medium',
                      !state.brand ? 'bg-earth-100 text-earth-900' : 'text-earth-700 hover:bg-earth-50'
                    )}
                  >
                    All brands
                  </button>
                </li>
                {brands.map((b) => (
                  <li key={b}>
                    <button
                      type="button"
                      onClick={() => state.setBrandAndGo(b)}
                      className={cn(
                        'flex min-h-10 w-full items-center rounded-md px-2.5 text-left text-[13px] font-medium',
                        state.brand === b
                          ? 'bg-earth-100 text-earth-900'
                          : 'text-earth-700 hover:bg-earth-50'
                      )}
                    >
                      {b}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!state.fashionHub && (
            <div>
              <p className="form-label mb-1.5">Dietary</p>
              <ul className="space-y-0.5">
                <li>
                  <button
                    type="button"
                    onClick={() => state.setDietaryAndGo('')}
                    className={cn(
                      'flex min-h-10 w-full items-center rounded-md px-2.5 text-left text-[13px] font-medium',
                      !state.dietary ? 'bg-earth-100 text-earth-900' : 'text-earth-700 hover:bg-earth-50'
                    )}
                  >
                    Any
                  </button>
                </li>
                {DIETARY_TAGS.map((tag) => (
                  <li key={tag}>
                    <button
                      type="button"
                      onClick={() => state.setDietaryAndGo(tag)}
                      className={cn(
                        'flex min-h-10 w-full items-center rounded-md px-2.5 text-left text-[13px] font-medium',
                        state.dietary === tag
                          ? 'bg-earth-100 text-earth-900'
                          : 'text-earth-700 hover:bg-earth-50'
                      )}
                    >
                      {DIETARY_TAG_LABEL[tag]}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>
      </div>

      <div className="rounded-xl border border-earth-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-earth-500">
          {state.fashionHub ? 'Fashion category' : 'Category'}
        </p>
        <div className="mt-3">
          <CategoryList
            activeCategory={state.activeCategory}
            onSelect={state.setCategoryAndGo}
            categoryCount={categoryCount}
            fashionHub={state.fashionHub}
          />
        </div>
      </div>
    </div>
  )
}

export function ShopFiltersBar({
  categoryCount,
  brands = [],
}: {
  categoryCount?: Record<string, number>
  brands?: string[]
}) {
  const state = useShopFilterState()

  // iOS-safe scroll lock: position:fixed the body while the drawer is open.
  // removeProperty + behavior:'instant' avoids the Safari scroll-jump bug.
  useEffect(() => {
    if (!state.mobileOpen) return
    const y = window.scrollY
    document.body.style.setProperty('position', 'fixed')
    document.body.style.setProperty('top', `-${y}px`)
    document.body.style.setProperty('width', '100%')
    document.body.style.setProperty('overflow-y', 'scroll')
    return () => {
      document.body.style.removeProperty('position')
      document.body.style.removeProperty('top')
      document.body.style.removeProperty('width')
      document.body.style.removeProperty('overflow-y')
      window.scrollTo({ top: y, behavior: 'instant' } as ScrollToOptions)
    }
  }, [state.mobileOpen])

  const mobileCategories = categoryOptions(state.fashionHub, categoryCount)

  return (
    <div className="space-y-2 lg:hidden">
      {/* Horizontal category pills with right-fade gradient */}
      <div className="relative">
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none [mask-image:linear-gradient(to_right,black_calc(100%-2.5rem),transparent_100%)]">
          <button
            type="button"
            onClick={() => state.setCategoryAndGo('')}
            className={cn(
              'shrink-0 rounded-full px-4 py-2.5 text-xs font-medium transition-colors min-h-11',
              !state.activeCategory
                ? 'bg-earth-900 text-white'
                : 'border border-earth-200 bg-white text-earth-700 hover:border-earth-300'
            )}
          >
            {state.fashionHub ? 'All fashion' : 'All'}
          </button>
          {mobileCategories.slice(0, 12).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => state.setCategoryAndGo(c)}
              className={cn(
                'shrink-0 rounded-full px-4 py-2.5 text-xs font-medium transition-colors min-h-11',
                state.activeCategory === c
                  ? 'bg-earth-900 text-white'
                  : 'border border-earth-200 bg-white text-earth-700 hover:border-earth-300'
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-11 flex-1 gap-1.5 text-xs sm:flex-none"
          onClick={() => state.setMobileOpen((v) => !v)}
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
          {state.activeFilterCount > 0 && (
            <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-700 px-1 text-[10px] font-semibold text-white">
              {state.activeFilterCount}
            </span>
          )}
        </Button>
        <div className="min-w-0 flex-1 sm:flex-none">
          <SortMenu />
        </div>
      </div>

      {state.mobileOpen && (
        <>
          <button
            type="button"
            className="animate-fade-in fixed inset-0 z-40 bg-earth-950/45"
            onClick={() => state.setMobileOpen(false)}
            aria-hidden
            tabIndex={-1}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className="animate-slide-up fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-2xl border-t border-earth-200 bg-white shadow-[var(--shadow-premium)]"
          >
            {/* Drag handle */}
            <div className="flex shrink-0 flex-col items-center pb-1 pt-3">
              <div className="h-1 w-10 rounded-full bg-earth-200" />
            </div>

            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-earth-100 px-5 py-3">
              <p className="text-sm font-semibold text-earth-900">
                Filters
                {state.activeFilterCount > 0 && (
                  <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-700 px-1.5 text-[10px] font-semibold text-white">
                    {state.activeFilterCount}
                  </span>
                )}
              </p>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-md text-earth-600 transition-colors hover:bg-earth-50"
                onClick={() => state.setMobileOpen(false)}
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-5">
              <form
                id="mobile-filter-form"
                onSubmit={state.apply}
                className="space-y-6"
              >
                {/* Category */}
                <div>
                  <p className="form-label mb-2.5">
                    {state.fashionHub ? 'Fashion category' : 'Category'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => state.setCategoryAndGo('')}
                      className={cn(
                        'rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
                        !state.activeCategory
                          ? 'bg-earth-900 text-white'
                          : 'border border-earth-200 bg-white text-earth-700'
                      )}
                    >
                      {state.fashionHub ? 'All fashion' : 'All'}
                    </button>
                    {mobileCategories.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => state.setCategoryAndGo(c)}
                        className={cn(
                          'rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
                          state.activeCategory === c
                            ? 'bg-earth-900 text-white'
                            : 'border border-earth-200 bg-white text-earth-700'
                        )}
                      >
                        {c}
                        {!state.fashionHub && categoryCount?.[c] != null && (
                          <span className={cn(
                            'ml-1 tabular-nums',
                            state.activeCategory === c ? 'text-white/70' : 'text-earth-400'
                          )}>
                            {categoryCount[c]}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stock */}
                <div>
                  <p className="form-label mb-2.5">Availability</p>
                  <StockToggle checked={state.inStockOnly} onChange={state.toggleStockAndGo} />
                </div>

                {/* Price */}
                <div>
                  <p className="form-label mb-2.5">Price range</p>
                  <PriceFields
                    minPrice={state.minPrice}
                    maxPrice={state.maxPrice}
                    setMinPrice={state.setMinPrice}
                    setMaxPrice={state.setMaxPrice}
                  />
                </div>

                {brands.length > 0 && (
                  <div>
                    <p className="form-label mb-2.5">
                      {state.fashionHub ? 'Brand / line' : 'Brand'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => state.setBrandAndGo('')}
                        className={cn(
                          'rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
                          !state.brand
                            ? 'bg-earth-900 text-white'
                            : 'border border-earth-200 bg-white text-earth-700'
                        )}
                      >
                        All brands
                      </button>
                      {brands.map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => state.setBrandAndGo(b)}
                          className={cn(
                            'rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
                            state.brand === b
                              ? 'bg-earth-900 text-white'
                              : 'border border-earth-200 bg-white text-earth-700'
                          )}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Footer */}
            <div className="flex shrink-0 gap-2 border-t border-earth-100 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Button form="mobile-filter-form" type="submit" size="lg" className="h-11 flex-1">
                Apply filters
              </Button>
              {state.hasFilters && (
                <Button type="button" size="lg" variant="outline" className="h-11 px-5" onClick={state.reset}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export function ActiveFilterChips() {
  const sp = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const chips: { key: string; label: string; clear: () => void }[] = []
  const fashionHub =
    pathname === '/fashion' || parseShopDept(sp.get('dept')) === 'fashion'
  const catalogBase = fashionHub ? '/fashion' : '/shop'

  const q = sp.get('q')
  const category = sp.get('category')
  const brand = sp.get('brand')
  const dietary = sp.get('dietary')
  const minPrice = sp.get('minPrice')
  const maxPrice = sp.get('maxPrice')
  const inStock = sp.get('inStock') === '1'

  function pushParams(mutate: (p: URLSearchParams) => void) {
    const p = new URLSearchParams(sp.toString())
    p.delete('dept')
    mutate(p)
    router.push(`${catalogBase}${p.toString() ? `?${p.toString()}` : ''}`, { scroll: false })
  }

  function clearKey(key: string) {
    pushParams((p) => {
      p.delete(key)
    })
  }

  if (q) chips.push({ key: 'q', label: `"${q}"`, clear: () => clearKey('q') })
  if (category) chips.push({ key: 'category', label: category, clear: () => clearKey('category') })
  if (brand) chips.push({ key: 'brand', label: brand, clear: () => clearKey('brand') })
  if (dietary) {
    chips.push({
      key: 'dietary',
      label: DIETARY_TAG_LABEL[dietary as keyof typeof DIETARY_TAG_LABEL] ?? dietary,
      clear: () => clearKey('dietary'),
    })
  }
  if (minPrice || maxPrice) {
    chips.push({
      key: 'price',
      label: `$${minPrice || '0'}–$${maxPrice || '∞'}`,
      clear: () =>
        pushParams((p) => {
          p.delete('minPrice')
          p.delete('maxPrice')
        }),
    })
  }
  if (inStock) {
    chips.push({ key: 'inStock', label: 'In stock', clear: () => clearKey('inStock') })
  }

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.clear}
          className="inline-flex items-center gap-1.5 rounded-full border border-earth-200 bg-white px-2.5 py-1 text-xs font-medium text-earth-700 transition-colors hover:border-earth-300 hover:bg-earth-50"
        >
          {chip.label}
          <X className="h-3 w-3" aria-hidden />
        </button>
      ))}
      <button
        type="button"
        onClick={() => router.push(catalogBase, { scroll: false })}
        className="text-xs font-medium text-brand-700 hover:underline"
      >
        Clear all
      </button>
    </div>
  )
}

/** @deprecated Use ShopFiltersBar + ShopFiltersSidebar */
export function ShopFilters() {
  return <ShopFiltersBar />
}
