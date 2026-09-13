import Link from 'next/link'
import { Search, Users } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdminPage } from '@/lib/auth/require-admin-page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/admin/Pagination'

const PAGE_SIZE = 50

type CustomerRow = {
  id: string
  full_name: string | null
  phone: string | null
  role: string | null
  created_at: string
}

type CustomerStat = {
  orders: number
  spend: number
  email: string | null
  lastOrderAt: string | null
}

type SortKey = 'recent' | 'spend' | 'orders' | 'last_order'

const SORT_OPTIONS: Array<{ id: SortKey; label: string }> = [
  { id: 'recent', label: 'Newest signup' },
  { id: 'spend', label: 'Top spenders' },
  { id: 'orders', label: 'Most orders' },
  { id: 'last_order', label: 'Recent activity' },
]

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; page?: string }>
}) {
  await requireAdminPage()
  const sp = await searchParams
  const q = sp.q?.trim() ?? ''
  const sort = (SORT_OPTIONS.find((o) => o.id === sp.sort)?.id ?? 'recent') as SortKey
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)

  // Pull everything (with a sane upper bound) and aggregate in memory.
  // For >5k customers we'd move to a SQL aggregation; until then this is fine
  // and avoids N+1 round-trips.
  const [{ data: profiles, error }, { data: orders }] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone, role, created_at')
      .order('created_at', { ascending: false })
      .limit(1000),
    supabaseAdmin
      .from('orders')
      .select('user_id, total_amount, customer_email, created_at'),
  ])

  const stats: Record<string, CustomerStat> = {}
  for (const o of orders ?? []) {
    if (!o.user_id) continue
    const cur = stats[o.user_id] ?? {
      orders: 0,
      spend: 0,
      email: null,
      lastOrderAt: null,
    }
    cur.orders += 1
    cur.spend += Number(o.total_amount ?? 0)
    if (!cur.email && o.customer_email) cur.email = o.customer_email
    if (!cur.lastOrderAt || (o.created_at && o.created_at > cur.lastOrderAt)) {
      cur.lastOrderAt = o.created_at
    }
    stats[o.user_id] = cur
  }

  const qLower = q.toLowerCase()
  const visible = (profiles ?? []).filter((p) => {
    if (!q) return true
    const stat = stats[p.id]
    return (
      p.full_name?.toLowerCase().includes(qLower) ||
      p.phone?.toLowerCase().includes(qLower) ||
      stat?.email?.toLowerCase().includes(qLower)
    )
  })

  visible.sort((a, b) => {
    const sa = stats[a.id]
    const sb = stats[b.id]
    if (sort === 'spend') return (sb?.spend ?? 0) - (sa?.spend ?? 0)
    if (sort === 'orders') return (sb?.orders ?? 0) - (sa?.orders ?? 0)
    if (sort === 'last_order') {
      const la = sa?.lastOrderAt ?? ''
      const lb = sb?.lastOrderAt ?? ''
      return lb.localeCompare(la)
    }
    return b.created_at.localeCompare(a.created_at)
  })

  const grandTotalSpend = (orders ?? []).reduce(
    (s, o) => s + Number(o.total_amount ?? 0),
    0
  )
  const customersWithOrders = Object.keys(stats).length

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function buildPageHref(p: number): string {
    const u = new URLSearchParams()
    if (q) u.set('q', q)
    if (sort !== 'recent') u.set('sort', sort)
    if (p > 1) u.set('page', String(p))
    return `/admin/customers${u.toString() ? `?${u.toString()}` : ''}`
  }

  function sortHref(s: SortKey): string {
    const u = new URLSearchParams()
    if (q) u.set('q', q)
    if (s !== 'recent') u.set('sort', s)
    return `/admin/customers${u.toString() ? `?${u.toString()}` : ''}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="admin-page-title">Customers</h1>
        <p className="mt-1 text-sm text-earth-500">
          {profiles?.length ?? 0} profile{(profiles?.length ?? 0) === 1 ? '' : 's'} ·{' '}
          {customersWithOrders} have ordered · ${grandTotalSpend.toFixed(2)} all-time
        </p>
      </div>

      {error && <p className="error">{error.message}</p>}

      <form method="GET" className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-md flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-earth-400"
            aria-hidden
          />
          <Input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search by name, email, or phone"
            className="pl-10"
          />
        </div>
        {sort !== 'recent' && <input type="hidden" name="sort" value={sort} />}
        <Button type="submit" size="sm">
          Search
        </Button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        {SORT_OPTIONS.map((opt) => {
          const active = sort === opt.id
          return (
            <Link
              key={opt.id}
              href={sortHref(opt.id)}
              className={`admin-status-pill no-underline ${
                active
                  ? 'bg-earth-900 text-white'
                  : 'bg-white text-earth-700 ring-1 ring-earth-200 hover:bg-earth-50'
              }`}
            >
              {opt.label}
            </Link>
          )
        })}
      </div>

      {!paginated || paginated.length === 0 ? (
        <div className="admin-card flex flex-col items-center text-center">
          <Users className="h-10 w-10 text-earth-300" strokeWidth={1.5} aria-hidden />
          <p className="mt-3 text-sm text-earth-600">
            {q ? 'No customers match this search.' : 'No customers yet.'}
          </p>
        </div>
      ) : (
        <>
          <div className="admin-table-wrap hidden overflow-x-auto sm:block">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Orders</th>
                  <th>Spend</th>
                  <th>Last order</th>
                  <th>Joined</th>
                  <th aria-label="Actions"></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((p: CustomerRow) => {
                  const stat = stats[p.id]
                  const isAdmin = p.role === 'admin'
                  return (
                    <tr key={p.id}>
                      <td className="font-medium text-earth-900">{p.full_name || '—'}</td>
                      <td className="text-earth-600">{stat?.email ?? '—'}</td>
                      <td className="text-earth-600">{p.phone || '—'}</td>
                      <td>
                        <span
                          className={`admin-status-pill ${
                            isAdmin ? 'bg-violet-50 text-violet-700' : 'bg-earth-100 text-earth-700'
                          }`}
                        >
                          {p.role || 'user'}
                        </span>
                      </td>
                      <td className="tabular-nums">{stat?.orders ?? 0}</td>
                      <td className="tabular-nums font-medium text-earth-900">
                        ${(stat?.spend ?? 0).toFixed(2)}
                      </td>
                      <td className="text-earth-600">
                        {stat?.lastOrderAt
                          ? new Date(stat.lastOrderAt).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="text-earth-600">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                      <td className="text-right">
                        <Link
                          href={`/admin/customers/${p.id}`}
                          className="text-sm font-medium text-brand-700 no-underline hover:text-brand-800"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <ul className="space-y-2 sm:hidden">
            {paginated.map((p: CustomerRow) => {
              const stat = stats[p.id]
              return (
                <li key={p.id}>
                  <Link
                    href={`/admin/customers/${p.id}`}
                    className="admin-card flex flex-col gap-2 no-underline"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-earth-900">{p.full_name || '—'}</p>
                        <p className="truncate text-xs text-earth-500">{stat?.email ?? '—'}</p>
                      </div>
                      <span className="tabular-nums text-sm font-semibold text-earth-900">
                        ${(stat?.spend ?? 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-xs text-earth-500">
                      <span>
                        {stat?.orders ?? 0} order{(stat?.orders ?? 0) === 1 ? '' : 's'}
                      </span>
                      <span>
                        {stat?.lastOrderAt
                          ? `Last: ${new Date(stat.lastOrderAt).toLocaleDateString()}`
                          : `Joined: ${new Date(p.created_at).toLocaleDateString()}`}
                      </span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
          <Pagination page={safePage} totalPages={totalPages} buildHref={buildPageHref} />
        </>
      )}
    </div>
  )
}
