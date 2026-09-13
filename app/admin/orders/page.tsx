import Link from 'next/link'
import { Download, Search } from 'lucide-react'
import { DateTime } from 'luxon'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUSES,
  normalizeOrderStatus,
  type OrderStatus,
} from '@/lib/order-status'
import { requireAdminPage } from '@/lib/auth/require-admin-page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { parseOrderRef } from '@/lib/orders/order-number'
import { getReportTimeZone } from '@/lib/admin/revenue-stats'
import { NEEDS_ACTION_STATUSES } from '@/lib/admin/ops-health'
import { BulkOrdersTable } from '@/components/admin/BulkOrdersTable'
import { Pagination } from '@/components/admin/Pagination'

const STATUS_PILL_COLORS: Record<OrderStatus, string> = {
  ordered: 'bg-blue-50 text-blue-700',
  processing: 'bg-amber-50 text-amber-700',
  ready_for_pickup: 'bg-teal-50 text-teal-700',
  shipped: 'bg-violet-50 text-violet-700',
  out_for_delivery: 'bg-indigo-50 text-indigo-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
}

const PAGE_SIZE = 50

  type OrderListRow = {
  id: string
  order_number: number | null
  customer_name: string | null
  customer_email: string | null
  city: string | null
  total_amount: number | null
  status: string | null
  created_at: string
  shipping_method: string | null
  payment_status?: string | null
  order_source?: string | null
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; when?: string; page?: string; queue?: string }>
}) {
  await requireAdminPage()
  const { status: rawStatus, q, when, page: pageParam, queue: rawQueue } = await searchParams
  const activeStatus = rawStatus ? normalizeOrderStatus(rawStatus) : undefined
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)

  // Default to the fulfillment queue so staff land on work, not history.
  // Searches default to all so customer lookups aren't hidden by the queue.
  const queue: 'needs_action' | 'all' = activeStatus
    ? 'all'
    : rawQueue === 'all' || Boolean(q?.trim())
      ? 'all'
      : rawQueue === 'needs_action' || !rawQueue
        ? 'needs_action'
        : 'all'

  const zone = getReportTimeZone()
  const now = DateTime.now().setZone(zone)
  const todayStart = now.startOf('day')
  let whenStart: DateTime | null = null
  let whenEnd: DateTime | null = null
  if (when === 'today') {
    whenStart = todayStart
    whenEnd = todayStart.plus({ days: 1 })
  } else if (when === 'yesterday') {
    whenStart = todayStart.minus({ days: 1 })
    whenEnd = todayStart
  } else if (when === '7d') {
    whenStart = todayStart.minus({ days: 6 })
    whenEnd = todayStart.plus({ days: 1 })
  }

  type FilterChain = {
    gte: (column: string, value: string) => FilterChain
    lt: (column: string, value: string) => FilterChain
    or: (filters: string) => FilterChain
  }

  function applyCommonFilters<T extends FilterChain>(query: T): T {
    let next: FilterChain = query
    if (whenStart && whenEnd) {
      next = next.gte('created_at', whenStart.toUTC().toISO()!).lt('created_at', whenEnd.toUTC().toISO()!)
    }
    if (q?.trim()) {
      const term = q.trim()
      const ref = parseOrderRef(term)
      if (ref?.type === 'number') {
        next = next.or(
          `customer_name.ilike.%${term}%,customer_email.ilike.%${term}%,order_number.eq.${ref.value}`
        )
      } else if (ref?.type === 'uuid') {
        next = next.or(
          `customer_name.ilike.%${term}%,customer_email.ilike.%${term}%,id.eq.${ref.value}`
        )
      } else {
        next = next.or(`customer_name.ilike.%${term}%,customer_email.ilike.%${term}%`)
      }
    }
    return next as T
  }

  // Lightweight status rows for pill counts (same when/q scope).
  let statusQuery = supabaseAdmin.from('orders').select('status')
  statusQuery = applyCommonFilters(statusQuery as never) as typeof statusQuery
  const { data: statusRows } = await statusQuery

  const counts = ORDER_STATUSES.reduce<Record<string, number>>((acc, status) => {
    acc[status] = 0
    return acc
  }, {})
  let totalInScope = 0
  let needsActionCount = 0
  for (const row of statusRows ?? []) {
    totalInScope += 1
    const st = normalizeOrderStatus(row.status)
    counts[st] = (counts[st] ?? 0) + 1
    if ((NEEDS_ACTION_STATUSES as readonly string[]).includes(st)) needsActionCount += 1
  }

  let listQuery = supabaseAdmin
    .from('orders')
    .select(
      'id, order_number, customer_name, customer_email, city, total_amount, status, created_at, shipping_method, payment_status, order_source',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })

  listQuery = applyCommonFilters(listQuery as never) as typeof listQuery
  if (activeStatus) {
    listQuery = listQuery.eq('status', activeStatus)
  } else if (queue === 'needs_action') {
    listQuery = listQuery.in('status', [...NEEDS_ACTION_STATUSES])
  }

  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  let orders: OrderListRow[] | null = null
  let filteredCount: number | null = null

  {
    const first = await listQuery.range(from, to)
    if (first.error && /payment_status|order_source/i.test(first.error.message)) {
      let legacyQuery = supabaseAdmin
        .from('orders')
        .select(
          'id, order_number, customer_name, customer_email, city, total_amount, status, created_at, shipping_method',
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
      legacyQuery = applyCommonFilters(legacyQuery as never) as typeof legacyQuery
      if (activeStatus) legacyQuery = legacyQuery.eq('status', activeStatus)
      else if (queue === 'needs_action') {
        legacyQuery = legacyQuery.in('status', [...NEEDS_ACTION_STATUSES])
      }
      const legacy = await legacyQuery.range(from, to)
      orders = (legacy.data ?? null) as OrderListRow[] | null
      filteredCount = legacy.count
    } else {
      orders = (first.data ?? null) as OrderListRow[] | null
      filteredCount = first.count
    }
  }

  const paginated = (orders ?? []) as OrderListRow[]
  const filteredTotal = filteredCount ?? paginated.length
  const filteredRevenue = paginated.reduce((s, o) => s + Number(o.total_amount ?? 0), 0)
  const totalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  function buildPageHref(p: number) {
    const sp = new URLSearchParams()
    if (activeStatus) sp.set('status', activeStatus)
    else if (queue === 'all') sp.set('queue', 'all')
    else sp.set('queue', 'needs_action')
    if (q) sp.set('q', q)
    if (when) sp.set('when', when)
    if (p > 1) sp.set('page', String(p))
    return `/admin/orders${sp.toString() ? `?${sp.toString()}` : ''}`
  }

  const exportHref =
    when === 'today' ? '/api/admin/orders/export?range=today'
    : when === 'yesterday' ? '/api/admin/orders/export?range=yesterday'
    : when === '7d' ? '/api/admin/orders/export?range=7d'
    : '/api/admin/orders/export?range=all'

  const whenOptions: Array<{ id: 'today' | 'yesterday' | '7d' | undefined; label: string }> = [
    { id: undefined, label: 'Any time' },
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: '7d', label: 'Last 7 days' },
  ]

  function statusFilterHref(extra: Record<string, string | undefined>) {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (when) sp.set('when', when)
    for (const [k, v] of Object.entries(extra)) {
      if (v) sp.set(k, v)
    }
    return `/admin/orders${sp.toString() ? `?${sp.toString()}` : ''}`
  }

  const showingNeedsAction = queue === 'needs_action' && !activeStatus

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="admin-page-title">Orders</h1>
          <p className="mt-1 text-sm text-earth-500">
            {showingNeedsAction
              ? `${filteredTotal} need action · ${totalInScope} in scope`
              : `${filteredTotal} shown · ${totalInScope} in scope`}
            {` · $${filteredRevenue.toFixed(2)} on this page`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/orders/new" className="no-underline">
            <Button size="sm" className="gap-1.5">
              Phone order
            </Button>
          </Link>
          <Link href={exportHref} className="no-underline">
            <Button size="sm" variant="outline" className="gap-1.5">
              <Download className="h-4 w-4" aria-hidden />
              Export CSV
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {whenOptions.map((opt) => {
          const active = (opt.id ?? '') === (when ?? '')
          const sp = new URLSearchParams()
          if (opt.id) sp.set('when', opt.id)
          if (q) sp.set('q', q)
          if (activeStatus) sp.set('status', activeStatus)
          else if (queue === 'all') sp.set('queue', 'all')
          else sp.set('queue', 'needs_action')
          const href = `/admin/orders${sp.toString() ? `?${sp.toString()}` : ''}`
          return (
            <Link
              key={opt.id ?? 'any'}
              href={href}
              className={`admin-status-pill no-underline ${active ? 'bg-earth-900 text-white' : 'bg-white text-earth-700 ring-1 ring-earth-200 hover:bg-earth-50'}`}
            >
              {opt.label}
            </Link>
          )
        })}
      </div>

      <form method="GET" className="flex items-center gap-2">
        <div className="relative max-w-md flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-earth-400"
            aria-hidden
          />
          <Input
            type="search"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Search by name, email, or LQ-1042"
            className="pl-10"
          />
        </div>
        {activeStatus && <input type="hidden" name="status" value={activeStatus} />}
        {!activeStatus && <input type="hidden" name="queue" value="all" />}
        {when && <input type="hidden" name="when" value={when} />}
        <Button type="submit" size="sm">
          Search
        </Button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        <Link
          href={statusFilterHref({ queue: 'needs_action' })}
          className={`admin-status-pill no-underline ${
            showingNeedsAction
              ? 'bg-earth-900 text-white'
              : 'bg-amber-50 text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100'
          }`}
        >
          Needs action ({needsActionCount})
        </Link>
        <Link
          href={statusFilterHref({ queue: 'all' })}
          className={`admin-status-pill no-underline ${
            queue === 'all' && !activeStatus
              ? 'bg-earth-900 text-white'
              : 'bg-white text-earth-700 ring-1 ring-earth-200 hover:bg-earth-50'
          }`}
        >
          All ({totalInScope})
        </Link>
        {ORDER_STATUSES.map((status) => {
          const href = statusFilterHref({ status })
          const isActive = activeStatus === status
          return (
            <Link
              key={status}
              href={href}
              className={`admin-status-pill no-underline ${isActive ? 'bg-earth-900 text-white' : `${STATUS_PILL_COLORS[status]} hover:opacity-80`}`}
            >
              {ORDER_STATUS_LABEL[status]} ({counts[status] ?? 0})
            </Link>
          )
        })}
      </div>

      {paginated.length === 0 ? (
        <div className="admin-card text-center">
          <p className="text-sm text-earth-600">
            {showingNeedsAction ? 'No orders need action right now.' : 'No orders in this view.'}
          </p>
          {showingNeedsAction && (
            <Link
              href="/admin/orders?queue=all"
              className="mt-3 inline-block text-sm font-medium text-brand-700 no-underline hover:underline"
            >
              View all orders →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <BulkOrdersTable orders={paginated} />
          <Pagination page={safePage} totalPages={totalPages} buildHref={buildPageHref} />
        </div>
      )}
    </div>
  )
}
