'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, DoorOpen, HandHeart, MessageSquare, Phone, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { OrderStatus } from '@/lib/order-status'
import { DELIVERY_PROOF_LABEL, type DeliveryProof } from '@/lib/orders/delivery-proof'
import { smsHref, telHref } from '@/lib/phone-link'

type Props = {
  orderId: string
  status: OrderStatus
  customerPhone: string | null
  deliveryProof: DeliveryProof | null
  deliveryProofAt: string | null
  deliveryProofNote: string | null
}

/**
 * Counter-to-door workflow for orders the store delivers itself: go en route,
 * then close out at the door as handed over or left at the door.
 */
export function DeliveryRunPanel({
  orderId,
  status,
  customerPhone,
  deliveryProof,
  deliveryProofAt,
  deliveryProofNote,
}: Props) {
  const router = useRouter()
  const [pending, setPending] = useState<'route' | DeliveryProof | null>(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const delivered = status === 'delivered'
  const cancelled = status === 'cancelled'
  const enRoute = status === 'out_for_delivery'

  const tel = telHref(customerPhone)
  const sms = smsHref(customerPhone)
  const reachable = Boolean(tel)

  async function patch(next: OrderStatus, proof?: DeliveryProof) {
    setError('')
    setMessage('')
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: next,
        note: note.trim() || undefined,
        deliveryProof: proof,
      }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Could not update this order.')
      return false
    }
    return true
  }

  async function startRun() {
    setPending('route')
    try {
      if (await patch('out_for_delivery')) {
        setMessage('Marked en route — the customer has been emailed.')
        setNote('')
        router.refresh()
      }
    } finally {
      setPending(null)
    }
  }

  async function closeOut(proof: DeliveryProof) {
    setPending(proof)
    try {
      if (await patch('delivered', proof)) {
        setMessage(`${DELIVERY_PROOF_LABEL[proof]} — delivery closed.`)
        setNote('')
        router.refresh()
      }
    } finally {
      setPending(null)
    }
  }

  const contactLink =
    'inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-earth-200 bg-white px-3 text-sm font-medium text-earth-800 no-underline transition-colors duration-150 hover:border-earth-300 hover:bg-earth-50'

  return (
    <div className="space-y-4">
      {!reachable && !delivered && !cancelled && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-800">No reachable number on file</p>
          <p className="mt-1 text-xs text-earth-600">
            Get a phone number before you set off — you cannot call ahead or at the door without one.
          </p>
        </div>
      )}

      {delivered ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
            <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            {deliveryProof ? DELIVERY_PROOF_LABEL[deliveryProof] : 'Delivered'}
          </p>
          {deliveryProofAt && (
            <p className="mt-1 text-xs text-earth-600">
              {new Date(deliveryProofAt).toLocaleString()}
            </p>
          )}
          {deliveryProofNote && (
            <p className="mt-1 text-xs text-earth-600">{deliveryProofNote}</p>
          )}
        </div>
      ) : cancelled ? (
        <p className="text-sm text-earth-600">Order cancelled — no delivery pending.</p>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="form-label" htmlFor="delivery-note">
              Drop note (optional)
            </label>
            <Input
              id="delivery-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Behind the screen door, left of the mat"
              maxLength={200}
            />
          </div>

          {enRoute ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                className="min-h-11"
                onClick={() => closeOut('handed')}
                disabled={pending !== null}
              >
                <HandHeart className="h-4 w-4" aria-hidden />
                {pending === 'handed' ? 'Saving…' : 'Handed over'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={() => closeOut('left_at_door')}
                disabled={pending !== null}
              >
                <DoorOpen className="h-4 w-4" aria-hidden />
                {pending === 'left_at_door' ? 'Saving…' : 'Left at door'}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              className="min-h-11 w-full"
              onClick={startRun}
              disabled={pending !== null}
            >
              <Truck className="h-4 w-4" aria-hidden />
              {pending === 'route' ? 'Saving…' : 'Start delivery — en route'}
            </Button>
          )}
        </div>
      )}

      {tel || sms ? (
        <div className="flex flex-wrap gap-2">
          {tel && (
            <a href={tel} className={contactLink}>
              <Phone className="h-4 w-4" aria-hidden />
              Call
            </a>
          )}
          {sms && (
            <a href={sms} className={contactLink}>
              <MessageSquare className="h-4 w-4" aria-hidden />
              Text
            </a>
          )}
        </div>
      ) : null}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && (
        <p className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
          <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          {message}
        </p>
      )}
    </div>
  )
}
