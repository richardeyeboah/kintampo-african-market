'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MANUAL_SETTLE_OPTIONS, type ManualSettleMethod } from '@/lib/payment-methods'
import { cn } from '@/lib/utils'

export function MarkPaidPanel({
  orderId,
  paymentStatus,
  paymentMethod,
}: {
  orderId: string
  paymentStatus: 'paid' | 'unpaid'
  paymentMethod: ManualSettleMethod
}) {
  const router = useRouter()
  const [method, setMethod] = useState<ManualSettleMethod>(paymentMethod)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function setPaid(next: 'paid' | 'unpaid') {
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: next, paymentMethod: method }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Could not update payment.')
        return
      }
      router.refresh()
    } catch {
      setError('Network error.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="admin-card space-y-3">
      <h2 className="admin-section-title">Payment</h2>
      <p className="text-sm text-earth-500">
        {paymentStatus === 'unpaid'
          ? 'Customer has not paid yet. Mark paid when cash, Zelle, or card lands.'
          : 'Payment recorded. You can reverse to unpaid if that was a mistake.'}
      </p>

      <div className="flex flex-col gap-1.5">
        {MANUAL_SETTLE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={busy}
            onClick={() => setMethod(opt.value)}
            className={cn(
              'min-h-11 rounded-lg border px-3 text-left text-sm font-medium transition-colors duration-150',
              method === opt.value
                ? 'border-earth-900 bg-earth-900 text-white'
                : 'border-earth-200 bg-white text-earth-700 hover:border-earth-300'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {paymentStatus === 'unpaid' ? (
        <Button
          type="button"
          className="h-11 w-full"
          disabled={busy}
          onClick={() => void setPaid('paid')}
        >
          {busy ? 'Saving…' : 'Mark paid'}
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full"
          disabled={busy}
          onClick={() => void setPaid('unpaid')}
        >
          {busy ? 'Saving…' : 'Mark unpaid'}
        </Button>
      )}
    </section>
  )
}
