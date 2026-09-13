'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatOrderNumber } from '@/lib/orders/order-number'

type DeleteOrderButtonProps = {
  orderId: string
  orderNumber?: number | null
  /** When true, navigate back to the orders list after delete. */
  redirectToList?: boolean
}

export function DeleteOrderButton({
  orderId,
  orderNumber,
  redirectToList = true,
}: DeleteOrderButtonProps) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)

  const label = formatOrderNumber(orderNumber) || orderId.slice(0, 8)

  async function handleDelete() {
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Could not delete order.')
        setBusy(false)
        return
      }
      if (redirectToList) {
        router.push('/admin/orders?queue=all')
        router.refresh()
      } else {
        router.refresh()
      }
    } catch {
      setError('Network error.')
      setBusy(false)
    }
  }

  if (!confirming) {
    return (
      <Button type="button" variant="outline" onClick={() => setConfirming(true)}>
        <Trash2 className="h-4 w-4" aria-hidden />
        Delete order
      </Button>
    )
  }

  return (
    <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4">
      <p className="text-sm font-medium text-red-900">
        Permanently delete {label}? This removes the order from admin forever. It does not
        refund the customer in Stripe.
      </p>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="destructive" disabled={busy} onClick={handleDelete}>
          {busy ? 'Deleting…' : 'Yes, delete forever'}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => {
            setConfirming(false)
            setError('')
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
