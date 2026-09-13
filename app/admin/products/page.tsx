import Link from 'next/link'
import { AlertTriangle, FileText, Package, Plus, Search } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdminPage } from '@/lib/auth/require-admin-page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BulkProductsTable } from '@/components/admin/BulkProductsTable'

type StockFilter = 'all' | 'in' | 'out'
type SortKey = 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc'

type AdminProduct = {
  id: string
  name: string
  category: string | null
  price: number | null
  image_url: string | null
  in_stock: boolean | null
  created_at: string
}

function normalizeStock(raw: string | undefined): StockFilter {
  if (raw === 'in' || raw === 'out') return raw
  return 'all'
}

function normalizeSort(raw: string | undefined): SortKey {
  if (raw === 'name_desc' || raw === 'price_asc' || raw === 'price_desc') return raw
  return 'name_asc'
}

function buildQuery(
  params: Record<string, string | undefined>,
  override: Record<string, string | undefined>
): string {
  const merged = { ...params, ...override }
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(merged)) {
    if (v && v.length > 0) sp.set(k, v)
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string; stock?: string; sort?: string; minPrice?: string; maxPrice?: string }>
}) {
  await requireAdminPage()
  const sp = await searchParams
  const activeCategory = sp.cat?.trim() || null
  const search = sp.q?.trim() || ''
  const stock = normalizeStock(sp.stock)
  const sort = normalizeSort(sp.sort)
  const minPrice = sp.minPrice ? parseFloat(sp.minPrice) : null
  const maxPrice = sp.maxPrice ? parseFloat(sp.maxPrice) : null

  const linkParams = { cat: sp.cat, q: sp.q, stock: sp.stock, sort: sp.sort, minPrice: sp.minPrice, maxPrice: sp.maxPrice }

  const { data } = await supabaseAdmin
    .from('products')
    .select('id, name, category, price, image_url, in_stock, created_at')
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  const allProducts = (data ?? []) as AdminProduct[]
  const total = allProducts.length
  const inStockCount = allProducts.filter((p) => p.in_stock).length
  const outOfStockCount = total - inStockCount

  const searchLower = search.toLowerCase()
  const matchesFilters = (p: AdminProduct) => {
    if (stock === 'in' && !p.in_stock) return false
    if (stock === 'out' && p.in_stock) return false
    if (searchLower && !p.name.toLowerCase().includes(searchLower)) return false
    if (activeCategory && (p.category ?? '') !== activeCategory) return false
    if (minPrice !== null && Number(p.price ?? 0) < minPrice) return false
    if (maxPrice !== null && Number(p.price ?? 0) > maxPrice) return false
    return true
  }

  let visible = allProducts.filter(matchesFilters)

  // Sort
  visible = [...visible].sort((a, b) => {
    if (sort === 'price_asc') return Number(a.price ?? 0) - Number(b.price ?? 0)
    if (sort === 'price_desc') return Number(b.price ?? 0) - Number(a.price ?? 0)
    if (sort === 'name_desc') return b.name.localeCompare(a.name)
    return a.name.localeCompare(b.name)
  })

  const productsAfterNonCatFilters = allProducts.filter((p) => {
    if (stock === 'in' && !p.in_stock) return false
    if (stock === 'out' && p.in_stock) return false
    if (searchLower && !p.name.toLowerCase().includes(searchLower)) return false
    if (minPrice !== null && Number(p.price ?? 0) < minPrice) return false
    if (maxPrice !== null && Number(p.price ?? 0) > maxPrice) return false
    return true
  })

  const categoryStats = new Map<string, { total: number; outOfStock: number }>()
  for (const p of productsAfterNonCatFilters) {
    const cat = p.category ?? 'Uncategorized'
    const e = categoryStats.get(cat) ?? { total: 0, outOfStock: 0 }
    e.total += 1
    if (!p.in_stock) e.outOfStock += 1
    categoryStats.set(cat, e)
  }
  const sortedCategories = [...categoryStats.entries()].sort(
    (a, b) => b[1].total - a[1].total || a[0].localeCompare(b[0])
  )

  const grouped = new Map<string, AdminProduct[]>()
  for (const p of visible) {
    const cat = p.category ?? 'Uncategorized'
    const list = grouped.get(cat) ?? []
    list.push(p)
    grouped.set(cat, list)
  }
  const groupedEntries = [...grouped.entries()].sort(
    (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])
  )

  const SORT_OPTIONS: Array<{ id: SortKey; label: string }> = [
    { id: 'name_asc', label: 'Name A–Z' },
    { id: 'name_desc', label: 'Name Z–A' },
    { id: 'price_asc', label: 'Price low–high' },
    { id: 'price_desc', label: 'Price high–low' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="admin-page-title">Products</h1>
          <p className="mt-1 text-sm text-earth-500">
            {visible.length} shown · {total} total · {inStockCount} in stock · {outOfStockCount} out of stock
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/products/descriptions" className="no-underline">
            <Button size="sm" variant="outline" className="gap-1.5">
              <FileText className="h-4 w-4" /> Descriptions
            </Button>
          </Link>
          <Link href="/admin/products/fabrics/new" className="no-underline">
            <Button size="sm" variant="outline" className="gap-1.5">
              <Plus className="h-4 w-4" /> Add fabric / lace
            </Button>
          </Link>
          <Link href="/admin/products/new" className="no-underline">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Add product
            </Button>
          </Link>
        </div>
      </div>

      {/* Low stock alert */}
      {outOfStockCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              {outOfStockCount} product{outOfStockCount === 1 ? '' : 's'} out of stock
            </p>
            <p className="mt-0.5 text-xs text-amber-700">
              Customers can&apos;t buy these until you restock them.{' '}
              <Link href={`/admin/products${buildQuery(linkParams, { stock: 'out', cat: undefined })}`}
                className="font-medium underline text-amber-800"
              >
                View out of stock →
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Search + filters */}
      <form method="GET" className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-earth-400" aria-hidden />
            <Input type="search" name="q" defaultValue={search} placeholder="Search by name…" className="pl-10" />
          </div>
          {activeCategory && <input type="hidden" name="cat" value={activeCategory} />}
          {stock !== 'all' && <input type="hidden" name="stock" value={stock} />}
          {sort !== 'name_asc' && <input type="hidden" name="sort" value={sort} />}
          <Button type="submit" size="sm">Search</Button>
        </div>

        {/* Price range */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-earth-600">Price:</span>
          <div className="flex items-center gap-1">
            <span className="text-earth-400">$</span>
            <input
              type="number"
              name="minPrice"
              defaultValue={sp.minPrice ?? ''}
              placeholder="Min"
              min="0"
              step="0.01"
              className="form-input w-20 py-1 text-sm"
            />
          </div>
          <span className="text-earth-400">—</span>
          <div className="flex items-center gap-1">
            <span className="text-earth-400">$</span>
            <input
              type="number"
              name="maxPrice"
              defaultValue={sp.maxPrice ?? ''}
              placeholder="Max"
              min="0"
              step="0.01"
              className="form-input w-20 py-1 text-sm"
            />
          </div>
          {(sp.minPrice || sp.maxPrice) && (
            <Link href={`/admin/products${buildQuery(linkParams, { minPrice: undefined, maxPrice: undefined })}`}
              className="text-xs text-earth-500 hover:text-earth-700 underline"
            >
              Clear
            </Link>
          )}
        </div>
      </form>

      {/* Sort + stock filter row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {([
            { id: 'all', label: 'All' },
            { id: 'in', label: 'In stock' },
            { id: 'out', label: 'Out' },
          ] as Array<{ id: StockFilter; label: string }>).map((opt) => {
            const active = opt.id === stock
            return (
              <Link key={opt.id}
                href={`/admin/products${buildQuery(linkParams, { stock: opt.id === 'all' ? undefined : opt.id })}`}
                className={`admin-status-pill no-underline ${active ? 'bg-earth-900 text-white' : 'bg-white text-earth-700 ring-1 ring-earth-200 hover:bg-earth-50'}`}
              >
                {opt.label}
              </Link>
            )
          })}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-earth-500">Sort:</span>
          <div className="flex flex-wrap gap-1.5">
            {SORT_OPTIONS.map((opt) => (
              <Link key={opt.id}
                href={`/admin/products${buildQuery(linkParams, { sort: opt.id === 'name_asc' ? undefined : opt.id })}`}
                className={`admin-status-pill no-underline ${sort === opt.id ? 'bg-earth-900 text-white' : 'bg-white text-earth-700 ring-1 ring-earth-200 hover:bg-earth-50'}`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Category chips */}
      <div className="-mx-1 flex flex-wrap gap-1.5 px-1">
        <Link href={`/admin/products${buildQuery(linkParams, { cat: undefined })}`}
          className={`admin-status-pill no-underline ${!activeCategory ? 'bg-earth-900 text-white' : 'bg-white text-earth-700 ring-1 ring-earth-200 hover:bg-earth-50'}`}
        >
          All categories ({productsAfterNonCatFilters.length})
        </Link>
        {sortedCategories.map(([cat, stats]) => {
          const active = activeCategory === cat
          return (
            <Link key={cat}
              href={`/admin/products${buildQuery(linkParams, { cat })}`}
              className={`admin-status-pill inline-flex items-center gap-1 no-underline ${active ? 'bg-earth-900 text-white' : 'bg-white text-earth-700 ring-1 ring-earth-200 hover:bg-earth-50'}`}
              title={stats.outOfStock > 0 ? `${stats.outOfStock} out of stock` : undefined}
            >
              {cat} ({stats.total})
              {stats.outOfStock > 0 && (
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
              )}
            </Link>
          )
        })}
      </div>

      {visible.length === 0 ? (
        <div className="admin-card flex flex-col items-center text-center">
          <Package className="h-10 w-10 text-earth-300" strokeWidth={1.5} aria-hidden />
          {total === 0 ? (
            <>
              <p className="mt-3 text-sm text-earth-600">No products yet.</p>
              <Link href="/admin/products/new" className="mt-4 no-underline">
                <Button size="sm">Add the first one</Button>
              </Link>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm text-earth-600">No products match these filters.</p>
              <Link href="/admin/products" className="mt-4 no-underline">
                <Button size="sm" variant="outline">Clear filters</Button>
              </Link>
            </>
          )}
        </div>
      ) : activeCategory ? (
        <BulkProductsTable products={visible} />
      ) : (
        <div className="space-y-4">
          {groupedEntries.map(([cat, items]) => {
            const outOfStock = items.filter((p) => !p.in_stock).length
            return (
              <details key={cat} open className="admin-card group overflow-hidden p-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-earth-50">
                  <div className="flex items-center gap-3">
                    <h2 className="text-base font-semibold text-earth-900">{cat}</h2>
                    <span className="admin-status-pill bg-earth-100 text-earth-700">{items.length}</span>
                    {outOfStock > 0 && (
                      <span className="admin-status-pill inline-flex items-center gap-1 bg-amber-50 text-amber-700">
                        <AlertTriangle className="h-3 w-3" aria-hidden />
                        {outOfStock} out
                      </span>
                    )}
                  </div>
                  <span className="text-earth-400 transition-transform group-open:rotate-180" aria-hidden>▾</span>
                </summary>
                <div className="border-t border-earth-100">
                  <BulkProductsTable products={items} compact />
                </div>
              </details>
            )
          })}
        </div>
      )}
    </div>
  )
}
