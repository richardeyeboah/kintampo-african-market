'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  isPickupShippingMethod,
  normalizeOrderStatus,
  orderStatusLabel,
  type OrderStatus,
} from '@/lib/order-status'
import { formatOrderNumber } from '@/lib/orders/order-number'

const STATUS_PILL_COLORS: Record<OrderStatus, string> = {
  ordered: 'bg-blue-50 text-blue-700',
  processing: 'bg-amber-50 text-amber-700',
  ready_for_pickup: 'bg-teal-50 text-teal-700',
  shipped: 'bg-violet-50 text-violet-700',
  out_for_delivery: 'bg-indigo-50 text-indigo-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
}

const BULK_STATUSES: OrderStatus[] = ['processing', 'ready_for_pickup', 'shipped', 'delivered', 'cancelled']

type Order = {
  id: string
  order_number: number | null
  customer_name: string | null
  customer_email: string | null
  city: string | null
  total_amount: number | null
  status: string | null
  created_at: string
  shipping_method?: string | null
  payment_status?: string | null
  order_source?: string | null
}

const PICKUP_CHIP = 'inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700'
const UNPAID_CHIP = 'inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800'
const PHONE_CHIP = 'inline-flex items-center rounded-full bg-earth-100 px-2 py-0.5 text-[11px] font-semibold text-earth-700'

export function BulkOrdersTable({ orders }: { orders: Order[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>('shipped')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const allChecked = orders.length > 0 && selected.size === orders.length
  const someChecked = selected.size > 0 && selected.size < orders.length

  function toggleAll() {
    if (allChecked) setSelected(new Set())
    else setSelected(new Set(orders.map((o) => o.id)))
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function applyBulk() {
    if (!selected.size) return
    setLoading(true)
    setError('')
    setNotice('')
    try {
      const res = await fetch('/api/admin/orders/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selected], status: bulkStatus }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Bulk update failed.')
        return
      }
      if (typeof data.skipped === 'number' && data.skipped > 0) {
        setNotice(
          `${data.skipped} pickup order${data.skipped === 1 ? '' : 's'} skipped — pickup has no shipping step.`
        )
      }
      setSelected(new Set())
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function deleteSelected() {
    if (!selected.size) return
    const n = selected.size
    if (
      !confirm(
        `Permanently delete ${n} order${n === 1 ? '' : 's'}? This cannot be undone and does not refund Stripe.`
      )
    ) {
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/orders/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selected], action: 'delete' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Bulk delete failed.')
        return
      }
      setSelected(new Set())
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {selected.size > 0 && (
        <div className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-brand-900">{selected.size} selected</span>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-xs text-earth-500 hover:text-earth-700 underline"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="form-select flex-1 text-sm py-2 min-w-[140px]"
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as OrderStatus)}
            >
              {BULK_STATUSES.map((s) => (
                <option key={s} value={s}>{orderStatusLabel(s)}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={applyBulk}
              disabled={loading}
              className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? 'Updating…' : 'Apply'}
            </button>
            <button
              type="button"
              onClick={deleteSelected}
              disabled={loading}
              className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? 'Working…' : 'Delete selected'}
            </button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}

      {notice && <p className="text-sm text-earth-600">{notice}</p>}

      <div className="admin-table-wrap hidden overflow-x-auto sm:block">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={(el) => { if (el) el.indeterminate = someChecked }}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-earth-300"
                  aria-label="Select all"
                />
              </th>
              <th>Order</th>
              <th>Customer</th>
              <th>Email</th>
              <th>City</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th aria-label="Actions"></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const st = normalizeOrderStatus(order.status)
              const pickup = isPickupShippingMethod(order.shipping_method)
              const isChecked = selected.has(order.id)
              return (
                <tr key={order.id} className={isChecked ? 'bg-brand-50/40' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleOne(order.id)}
                      className="h-4 w-4 rounded border-earth-300"
                      aria-label={`Select order ${order.order_number}`}
                    />
                  </td>
                  <td className="font-mono text-xs font-semibold text-earth-900">
                    {formatOrderNumber(order.order_number) || '—'}
                  </td>
                  <td className="font-medium text-earth-900">{order.customer_name}</td>
                  <td className="text-earth-600">{order.customer_email}</td>
                  <td className="text-earth-600">{order.city ?? '—'}</td>
                  <td className="tabular-nums font-medium text-earth-900">
                    ${Number(order.total_amount ?? 0).toFixed(2)}
                  </td>
                  <td>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`admin-status-pill ${STATUS_PILL_COLORS[st]}`}>
                        {orderStatusLabel(st, { pickup })}
                      </span>
                      {pickup && <span className={PICKUP_CHIP}>Pickup</span>}
                      {order.payment_status === 'unpaid' && (
                        <span className={UNPAID_CHIP}>Unpaid</span>
                      )}
                      {order.order_source &&
                        order.order_source !== 'online' && (
                          <span className={PHONE_CHIP}>
                            {order.order_source === 'whatsapp'
                              ? 'WhatsApp'
                              : order.order_source === 'in_store'
                                ? 'In store'
                                : 'Phone'}
                          </span>
                        )}
                    </div>
                  </td>
                  <td className="text-earth-600">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
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
        {orders.map((order) => {
          const st = normalizeOrderStatus(order.status)
          const pickup = isPickupShippingMethod(order.shipping_method)
          const isChecked = selected.has(order.id)
          return (
            <li key={order.id} className="flex gap-2">
              <label className="flex items-center justify-center w-11 shrink-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleOne(order.id)}
                  className="h-5 w-5 rounded border-earth-300"
                />
              </label>
              <Link
                href={`/admin/orders/${order.id}`}
                className="admin-card flex flex-1 flex-col gap-1 no-underline"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs font-semibold text-earth-900">
                      {formatOrderNumber(order.order_number) || '—'}
                    </p>
                    <p className="text-sm font-medium text-earth-800">{order.customer_name}</p>
                  </div>
                  <span className="tabular-nums text-sm font-semibold text-earth-900">
                    ${Number(order.total_amount ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`admin-status-pill ${STATUS_PILL_COLORS[st]}`}>
                      {orderStatusLabel(st, { pickup })}
                    </span>
                    {pickup && <span className={PICKUP_CHIP}>Pickup</span>}
                    {order.payment_status === 'unpaid' && (
                      <span className={UNPAID_CHIP}>Unpaid</span>
                    )}
                    {order.order_source && order.order_source !== 'online' && (
                      <span className={PHONE_CHIP}>
                        {order.order_source === 'whatsapp'
                          ? 'WhatsApp'
                          : order.order_source === 'in_store'
                            ? 'In store'
                            : 'Phone'}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-earth-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
