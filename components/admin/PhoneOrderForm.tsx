'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Minus, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UsStateSelect } from '@/components/store/UsStateSelect'
import { MANUAL_SETTLE_OPTIONS, type ManualSettleMethod } from '@/lib/payment-methods'
import type { OrderSource, PaymentStatus } from '@/lib/orders/order-source'
import {
  calculateShipping,
  LOCAL_DELIVERY_FEE,
  type ShippingMethod,
} from '@/lib/shipping'
import { formatMoney } from '@/lib/utils'
import { cn } from '@/lib/utils'

type SearchHit = {
  id: string
  name: string
  price: number
  category: string
  inStock: boolean
}

type Line = {
  productId: string
  name: string
  price: number
  category: string
  quantity: number
}

const FULFILLMENT: Array<{ value: ShippingMethod; label: string; hint: string }> = [
  { value: 'pickup', label: 'Store pickup', hint: 'Customer collects at the store' },
  { value: 'local_delivery', label: 'Local delivery', hint: `We drive it · $${LOCAL_DELIVERY_FEE.toFixed(2)}` },
  { value: 'standard', label: 'Ship', hint: 'USPS / carrier label' },
]

const SOURCES: Array<{ value: OrderSource; label: string }> = [
  { value: 'phone', label: 'Phone call' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'in_store', label: 'In store' },
]

export function PhoneOrderForm() {
  const router = useRouter()
  const [source, setSource] = useState<OrderSource>('phone')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('pickup')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('unpaid')
  const [paymentMethod, setPaymentMethod] = useState<ManualSettleMethod>('cod')
  const [addressLine, setAddressLine] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('OH')
  const [postalCode, setPostalCode] = useState('')
  const [pickupContactName, setPickupContactName] = useState('')
  const [note, setNote] = useState('')
  const [lines, setLines] = useState<Line[]>([])
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [searching, setSearching] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 1) {
      setHits([])
      return
    }
    const t = window.setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/admin/products/search?q=${encodeURIComponent(q)}`)
        const data = await res.json().catch(() => ({}))
        setHits(Array.isArray(data.products) ? data.products : [])
      } catch {
        setHits([])
      } finally {
        setSearching(false)
      }
    }, 220)
    return () => window.clearTimeout(t)
  }, [query])

  function addProduct(hit: SearchHit) {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === hit.id)
      if (existing) {
        return prev.map((l) =>
          l.productId === hit.id ? { ...l, quantity: Math.min(99, l.quantity + 1) } : l
        )
      }
      return [
        ...prev,
        {
          productId: hit.id,
          name: hit.name,
          price: hit.price,
          category: hit.category,
          quantity: 1,
        },
      ]
    })
    setQuery('')
    setHits([])
    searchRef.current?.focus()
  }

  function setQty(productId: string, quantity: number) {
    // Clamp to 1 so clearing the input while typing doesn't drop the line.
    const next = Number.isFinite(quantity)
      ? Math.max(1, Math.min(99, Math.trunc(quantity)))
      : 1
    setLines((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, quantity: next } : l))
    )
  }

  function removeLine(productId: string) {
    setLines((prev) => prev.filter((l) => l.productId !== productId))
  }

  const subtotal = useMemo(
    () => Math.round(lines.reduce((s, l) => s + l.price * l.quantity, 0) * 100) / 100,
    [lines]
  )

  const shipping = useMemo(
    () =>
      calculateShipping({
        subtotal,
        country: 'United States',
        state: shippingMethod === 'pickup' ? 'OH' : state,
        method: shippingMethod,
      }),
    [subtotal, shippingMethod, state]
  )

  const estimatedTotal = Math.round((subtotal + shipping.fee) * 100) / 100
  const needsAddress = shippingMethod !== 'pickup'

  async function submit() {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail: customerEmail || null,
          source,
          shippingMethod,
          paymentStatus,
          paymentMethod,
          addressLine: needsAddress ? addressLine : null,
          city: needsAddress ? city : null,
          state: needsAddress ? state : null,
          postalCode: needsAddress ? postalCode : null,
          country: needsAddress ? 'United States' : null,
          pickupContactName: shippingMethod === 'pickup' ? pickupContactName : null,
          note,
          lines: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Could not create order.')
        return
      }
      router.push(`/admin/orders/${data.orderId}`)
      router.refresh()
    } catch {
      setError('Network error.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <section className="admin-card space-y-4">
          <h2 className="admin-section-title">How they reached you</h2>
          <div className="flex flex-wrap gap-2">
            {SOURCES.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSource(opt.value)}
                className={cn(
                  'min-h-11 rounded-lg border px-4 text-sm font-medium transition-colors duration-150',
                  source === opt.value
                    ? 'border-earth-900 bg-earth-900 text-white'
                    : 'border-earth-200 bg-white text-earth-700 hover:border-earth-300'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <section className="admin-card space-y-4">
          <h2 className="admin-section-title">Customer</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="form-label" htmlFor="po-name">
                Name
              </label>
              <Input
                id="po-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
            <div>
              <label className="form-label" htmlFor="po-phone">
                Phone
              </label>
              <Input
                id="po-phone"
                type="tel"
                inputMode="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                autoComplete="tel"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label" htmlFor="po-email">
                Email <span className="font-normal text-earth-400">(optional)</span>
              </label>
              <Input
                id="po-email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>
        </section>

        <section className="admin-card space-y-4">
          <h2 className="admin-section-title">Fulfillment</h2>
          <div className="grid gap-2 sm:grid-cols-3">
            {FULFILLMENT.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setShippingMethod(opt.value)}
                className={cn(
                  'min-h-[4.5rem] rounded-xl border px-3 py-3 text-left transition-colors duration-150',
                  shippingMethod === opt.value
                    ? 'border-brand-600 bg-brand-50'
                    : 'border-earth-200 bg-white hover:border-earth-300'
                )}
              >
                <span className="block text-sm font-semibold text-earth-900">{opt.label}</span>
                <span className="mt-0.5 block text-xs text-earth-500">{opt.hint}</span>
              </button>
            ))}
          </div>

          {shippingMethod === 'pickup' ? (
            <div>
              <label className="form-label" htmlFor="po-pickup-contact">
                Collected by <span className="font-normal text-earth-400">(optional)</span>
              </label>
              <Input
                id="po-pickup-contact"
                value={pickupContactName}
                onChange={(e) => setPickupContactName(e.target.value)}
                placeholder="If someone else is collecting"
              />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="form-label" htmlFor="po-address">
                  Street address
                </label>
                <Input
                  id="po-address"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  autoComplete="street-address"
                />
              </div>
              <div>
                <label className="form-label" htmlFor="po-city">
                  City
                </label>
                <Input id="po-city" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div>
                <label className="form-label" htmlFor="po-state">
                  State
                </label>
                <UsStateSelect id="po-state" value={state} onChange={setState} />
              </div>
              <div>
                <label className="form-label" htmlFor="po-zip">
                  ZIP
                </label>
                <Input
                  id="po-zip"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  autoComplete="postal-code"
                />
              </div>
            </div>
          )}
        </section>

        <section className="admin-card space-y-4">
          <h2 className="admin-section-title">Items</h2>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-earth-400"
              aria-hidden
            />
            <Input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              className="pl-9"
              aria-label="Search products"
            />
            {(hits.length > 0 || searching) && query.trim() && (
              <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-earth-200 bg-white py-1 shadow-[var(--shadow-card)]">
                {searching && hits.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-earth-500">Searching…</li>
                ) : null}
                {hits.map((hit) => (
                  <li key={hit.id}>
                    <button
                      type="button"
                      onClick={() => addProduct(hit)}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-earth-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-earth-900">{hit.name}</span>
                        <span className="text-xs text-earth-500">
                          {hit.category}
                          {!hit.inStock ? ' · out of stock' : ''}
                        </span>
                      </span>
                      <span className="shrink-0 tabular-nums font-semibold text-earth-900">
                        {formatMoney(hit.price)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {lines.length === 0 ? (
            <p className="text-sm text-earth-500">No items yet — search and tap to add.</p>
          ) : (
            <ul className="space-y-2">
              {lines.map((line) => (
                <li
                  key={line.productId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-earth-200 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-earth-900">{line.name}</p>
                    <p className="text-xs text-earth-500">{formatMoney(line.price)} each</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={`Fewer ${line.name}`}
                      disabled={line.quantity <= 1}
                      onClick={() => setQty(line.productId, line.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" aria-hidden />
                    </Button>
                    <input
                      type="number"
                      inputMode="numeric"
                      className="stepper-input h-11 w-14 font-semibold"
                      value={line.quantity}
                      min={1}
                      max={99}
                      onChange={(e) => setQty(line.productId, Number(e.target.value))}
                      aria-label={`${line.name} quantity`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={`More ${line.name}`}
                      onClick={() => setQty(line.productId, line.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                    </Button>
                    <button
                      type="button"
                      className="ml-1 inline-flex h-11 w-11 items-center justify-center text-earth-400 hover:text-red-600"
                      aria-label={`Remove ${line.name}`}
                      onClick={() => removeLine(line.productId)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                  <p className="w-full text-right text-sm font-semibold tabular-nums text-earth-900 sm:w-auto">
                    {formatMoney(line.price * line.quantity)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-card space-y-3">
          <h2 className="admin-section-title">Internal note</h2>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Allergies, gate code, call back after 5…"
            maxLength={500}
          />
        </section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <section className="admin-card space-y-4">
          <h2 className="admin-section-title">Payment</h2>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: 'unpaid' as const, label: 'Unpaid' },
                { value: 'paid' as const, label: 'Paid now' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPaymentStatus(opt.value)}
                className={cn(
                  'min-h-11 flex-1 rounded-lg border px-4 text-sm font-medium transition-colors duration-150',
                  paymentStatus === opt.value
                    ? opt.value === 'unpaid'
                      ? 'border-amber-700 bg-amber-700 text-white'
                      : 'border-emerald-700 bg-emerald-700 text-white'
                    : 'border-earth-200 bg-white text-earth-700 hover:border-earth-300'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-earth-500">
              {paymentStatus === 'paid' ? 'Collected via' : 'Will collect via'}
            </p>
            <div className="flex flex-col gap-1.5">
              {MANUAL_SETTLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPaymentMethod(opt.value)}
                  className={cn(
                    'min-h-11 rounded-lg border px-3 text-left text-sm font-medium transition-colors duration-150',
                    paymentMethod === opt.value
                      ? 'border-earth-900 bg-earth-900 text-white'
                      : 'border-earth-200 bg-white text-earth-700 hover:border-earth-300'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="admin-card space-y-3">
          <h2 className="admin-section-title">Totals</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-earth-600">Subtotal</dt>
              <dd className="tabular-nums font-medium text-earth-900">{formatMoney(subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-earth-600">{shipping.label}</dt>
              <dd className="tabular-nums font-medium text-earth-900">
                {shipping.fee === 0 ? '—' : formatMoney(shipping.fee)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-earth-100 pt-2">
              <dt className="font-semibold text-earth-900">Est. total</dt>
              <dd className="text-lg font-semibold tabular-nums text-earth-950">
                {formatMoney(estimatedTotal)}
              </dd>
            </div>
          </dl>
          <p className="text-xs text-earth-500">
            Sales tax is calculated on save from product categories.
          </p>

          {error ? (
            <p className="text-sm font-medium text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          <Button
            type="button"
            className="h-12 w-full"
            disabled={busy || lines.length === 0}
            onClick={() => void submit()}
          >
            {busy
              ? 'Saving…'
              : paymentStatus === 'unpaid'
                ? 'Create unpaid order'
                : 'Create paid order'}
          </Button>
        </section>
      </aside>
    </div>
  )
}
