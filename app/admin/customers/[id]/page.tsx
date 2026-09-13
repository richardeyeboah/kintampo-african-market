import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Mail, MapPin, Phone } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdminPage } from '@/lib/auth/require-admin-page'
import { ORDER_STATUS_LABEL, normalizeOrderStatus, type OrderStatus } from '@/lib/order-status'
import { formatOrderNumber } from '@/lib/orders/order-number'
import { EditCustomerForm } from '@/components/admin/EditCustomerForm'

const STATUS_PILL_COLORS: Record<OrderStatus, string> = {
  ordered: 'bg-blue-50 text-blue-700',
  processing: 'bg-amber-50 text-amber-700',
  ready_for_pickup: 'bg-teal-50 text-teal-700',
  shipped: 'bg-violet-50 text-violet-700',
  out_for_delivery: 'bg-indigo-50 text-indigo-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
}

export default async function CustomerDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdminPage()
  const { id } = await params

  const [{ data: profile, error: profileError }, { data: addresses }, { data: orders }] =
    await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select('id, full_name, phone, role, created_at')
        .eq('id', id)
        .maybeSingle(),
      supabaseAdmin
        .from('addresses')
        .select('id, label, full_name, phone, line1, line2, city, state, country, postal_code, is_default')
        .eq('user_id', id)
        .order('is_default', { ascending: false }),
      supabaseAdmin
        .from('orders')
        .select(
          'id, order_number, status, total_amount, customer_email, created_at, refunded_at'
        )
        .eq('user_id', id)
        .order('created_at', { ascending: false }),
    ])

  if (profileError || !profile) {
    notFound()
  }

  const ordersList = orders ?? []
  const ordersCount = ordersList.length
  const lifetimeSpend = ordersList.reduce(
    (s, o) => s + (o.refunded_at ? 0 : Number(o.total_amount ?? 0)),
    0
  )
  const refundsCount = ordersList.filter((o) => o.refunded_at).length
  const lastOrder = ordersList[0]
  const email = ordersList.find((o) => o.customer_email)?.customer_email ?? null

  return (
    <div className="space-y-6">
      <Link
        href="/admin/customers"
        className="inline-flex min-h-11 items-center gap-1 text-sm text-earth-600 no-underline hover:text-earth-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to customers
      </Link>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="admin-page-title">{profile.full_name || 'Unnamed customer'}</h1>
          <p className="mt-1 text-sm text-earth-500">
            Customer since {new Date(profile.created_at).toLocaleDateString()}
          </p>
        </div>
        {profile.role === 'admin' && (
          <span className="admin-status-pill bg-violet-50 text-violet-700">Admin</span>
        )}
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="admin-kpi">
          <p className="admin-kpi-label">Orders</p>
          <p className="admin-kpi-value">{ordersCount}</p>
        </div>
        <div className="admin-kpi">
          <p className="admin-kpi-label">Lifetime spend</p>
          <p className="admin-kpi-value">${lifetimeSpend.toFixed(2)}</p>
          <p className="admin-kpi-delta text-earth-500">excludes refunds</p>
        </div>
        <div className="admin-kpi">
          <p className="admin-kpi-label">Refunds</p>
          <p className={`admin-kpi-value ${refundsCount > 0 ? 'text-amber-700' : ''}`}>
            {refundsCount}
          </p>
        </div>
        <div className="admin-kpi">
          <p className="admin-kpi-label">Last order</p>
          <p className="admin-kpi-value text-base">
            {lastOrder ? new Date(lastOrder.created_at).toLocaleDateString() : '—'}
          </p>
        </div>
      </section>

      {/* Contact + addresses */}
      <div className="grid gap-6 md:grid-cols-3">
        <section className="admin-card lg:col-span-1">
          <h2 className="admin-section-title mb-3">Contact</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex items-start gap-2 text-earth-700">
              <Mail className="mt-0.5 h-4 w-4 text-earth-400" aria-hidden />
              <span className="break-all">{email || '—'}</span>
            </div>
            <div className="flex items-start gap-2 text-earth-700">
              <Phone className="mt-0.5 h-4 w-4 text-earth-400" aria-hidden />
              <span>{profile.phone || '—'}</span>
            </div>
          </dl>
          {email && (
            <Link
              href={`/admin/orders?queue=all&q=${encodeURIComponent(email)}`}
              className="mt-4 inline-block text-sm font-medium text-brand-700 no-underline hover:text-brand-800"
            >
              All orders by email →
            </Link>
          )}
          <EditCustomerForm
            customerId={profile.id}
            initialName={profile.full_name}
            initialPhone={profile.phone}
          />
        </section>

        <section className="admin-card lg:col-span-2">
          <h2 className="admin-section-title mb-3">Saved addresses</h2>
          {!addresses || addresses.length === 0 ? (
            <p className="text-sm text-earth-500">No saved addresses.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {addresses.map((a) => (
                <li
                  key={a.id}
                  className="rounded-lg border border-earth-200 bg-earth-50/60 p-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-earth-900">{a.label || 'Address'}</span>
                    {a.is_default && (
                      <span className="admin-status-pill bg-emerald-50 text-emerald-700">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-start gap-2 text-earth-700">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-earth-400" aria-hidden />
                    <div>
                      <p>{a.full_name || profile.full_name || '—'}</p>
                      <p>{a.line1}</p>
                      {a.line2 && <p>{a.line2}</p>}
                      <p>
                        {[a.city, a.state, a.postal_code].filter(Boolean).join(', ')}
                      </p>
                      {a.country && <p>{a.country}</p>}
                      {a.phone && <p className="mt-1 text-earth-500">{a.phone}</p>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Orders */}
      <section>
        <h2 className="admin-section-title mb-3">Order history</h2>
        {ordersList.length === 0 ? (
          <div className="admin-card text-center text-sm text-earth-500">
            No orders yet.
          </div>
        ) : (
          <div className="admin-table-wrap overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th aria-label="Actions"></th>
                </tr>
              </thead>
              <tbody>
                {ordersList.map((o) => {
                  const st = normalizeOrderStatus(o.status)
                  return (
                    <tr key={o.id}>
                      <td className="font-mono text-xs font-semibold text-earth-900">
                        {formatOrderNumber(o.order_number) || '—'}
                      </td>
                      <td className="text-earth-600">
                        {new Date(o.created_at).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </td>
                      <td>
                        <span className={`admin-status-pill ${STATUS_PILL_COLORS[st]}`}>
                          {ORDER_STATUS_LABEL[st]}
                        </span>
                        {o.refunded_at && (
                          <span className="ml-1 admin-status-pill bg-amber-50 text-amber-700">
                            Refunded
                          </span>
                        )}
                      </td>
                      <td className="tabular-nums">
                        ${Number(o.total_amount ?? 0).toFixed(2)}
                      </td>
                      <td className="text-right">
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="text-sm font-medium text-brand-700 no-underline hover:text-brand-800"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
