'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import {
  getStatusFlow,
  isPickupShippingMethod,
  orderStatusLabel,
  type OrderStatus,
} from '@/lib/order-status'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function OrderStatusUpdater({
  orderId,
  currentStatus,
  trackingNumber,
  shippingMethod,
}: {
  orderId: string
  currentStatus: string
  trackingNumber?: string | null
  shippingMethod?: string | null
}) {
  const pickup = isPickupShippingMethod(shippingMethod)
  const statuses: OrderStatus[] = [...getStatusFlow(shippingMethod), 'cancelled']
  const router = useRouter()
  const [selected, setSelected] = useState<OrderStatus>(
    (currentStatus as OrderStatus) ?? 'ordered'
  )
  const [tracking, setTracking] = useState(trackingNumber ?? '')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const dirty =
    selected !== currentStatus ||
    (tracking ?? '') !== (trackingNumber ?? '') ||
    note.trim() !== ''

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!dirty) return
    setLoading(true)
    setSaved(false)
    setError('')
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: selected,
          trackingNumber: tracking,
          note: note || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Could not update order.')
        return
      }
      setSaved(true)
      setNote('')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleUpdate} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="form-label" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            className="form-select"
            value={selected}
            onChange={(e) => setSelected(e.target.value as OrderStatus)}
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {orderStatusLabel(s, { pickup })}
              </option>
            ))}
          </select>
        </div>
        {!pickup && (
          <div className="space-y-1.5">
            <label className="form-label" htmlFor="tracking">
              Tracking number
            </label>
            <Input
              id="tracking"
              type="text"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="Tracking number"
            />
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="form-label" htmlFor="note">
          Note (optional)
        </label>
        <textarea
          id="note"
          rows={2}
          className="form-input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
        />
        <p className="text-[11px] text-earth-400">{note.length}/500 characters</p>
      </div>

      {error && <p className="error">{error}</p>}
      {saved && (
        <p className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
          <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden /> Saved
        </p>
      )}

      <Button type="submit" disabled={loading || !dirty}>
        {loading ? 'Saving…' : 'Update order'}
      </Button>
    </form>
  )
}
