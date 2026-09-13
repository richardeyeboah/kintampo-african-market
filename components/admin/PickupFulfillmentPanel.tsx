'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, FileText, Mail, MessageSquare, PackageCheck, Phone } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { orderStatusLabel, type OrderStatus } from '@/lib/order-status'
import {
  PICKUP_HOLD_HOURS,
  formatClockTime,
  formatHoldDuration,
  getPickupHold,
} from '@/lib/orders/pickup-hold'
import { smsHref, telHref } from '@/lib/phone-link'
import { cn } from '@/lib/utils'

type Props = {
  orderId: string
  status: OrderStatus
  readyAt: string | null
  customerPhone: string | null
  customerEmail: string | null
}

export function PickupFulfillmentPanel({
  orderId,
  status,
  readyAt,
  customerPhone,
  customerEmail,
}: Props) {
  const router = useRouter()
  const [pending, setPending] = useState<'ready' | 'collected' | 'notify' | null>(null)
  const [handoffNote, setHandoffNote] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // Rendered only after mount so the server and client agree on the clock.
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const collected = status === 'delivered'
  const cancelled = status === 'cancelled'
  const isReady = status === 'ready_for_pickup'
  const hold = now === null ? null : getPickupHold(readyAt, now)

  async function patchStatus(next: OrderStatus, note?: string) {
    setError('')
    setMessage('')
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next, note: note?.trim() || undefined }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Could not update this order.')
      return false
    }
    return true
  }

  async function markReady() {
    setPending('ready')
    try {
      if (await patchStatus('ready_for_pickup')) {
        setMessage('Customer notified — hold clock started.')
        router.refresh()
      }
    } finally {
      setPending(null)
    }
  }

  async function markCollected() {
    setPending('collected')
    try {
      const note = handoffNote.trim() ? `Handoff: ${handoffNote.trim()}` : undefined
      if (await patchStatus('delivered', note)) {
        setHandoffNote('')
        setMessage('Marked picked up.')
        router.refresh()
      }
    } finally {
      setPending(null)
    }
  }

  async function resendNotice() {
    setPending('notify')
    setError('')
    setMessage('')
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/notify`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Could not resend the notice.')
        return
      }
      setMessage(`Resent "${orderStatusLabel(status, { pickup: true })}" notice.`)
      router.refresh()
    } finally {
      setPending(null)
    }
  }

  const tel = telHref(customerPhone)
  const sms = smsHref(customerPhone)
  const contactLink =
    'inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-earth-200 bg-white px-3 text-sm font-medium text-earth-800 no-underline transition-colors duration-150 hover:border-earth-300 hover:bg-earth-50'

  return (
    <div className="space-y-4">
      {hold && !collected && !cancelled ? (
        <div
          className={cn(
            'rounded-xl border px-4 py-3',
            hold.overdue
              ? 'border-red-200 bg-red-50'
              : 'border-teal-200 bg-teal-50'
          )}
        >
          <p
            className={cn(
              'text-sm font-semibold',
              hold.overdue ? 'text-red-700' : 'text-teal-800'
            )}
          >
            {hold.overdue
              ? `Unclaimed — ${formatHoldDuration(hold.msRemaining)} past the hold window`
              : `${formatHoldDuration(hold.msRemaining)} left in the ${PICKUP_HOLD_HOURS}-hour hold`}
          </p>
          <p className="mt-1 text-xs text-earth-600">
            Ready {formatClockTime(hold.readyAt)} · Pick up by {formatClockTime(hold.dueAt)}
          </p>
        </div>
      ) : null}

      {collected ? (
        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
          <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          Picked up — nothing left to do.
        </p>
      ) : cancelled ? (
        <p className="text-sm text-earth-600">Order cancelled — no pickup pending.</p>
      ) : (
        <div className="space-y-3">
          {isReady ? (
            <div className="space-y-1.5">
              <label className="form-label" htmlFor="handoff-note">
                Handoff note (optional)
              </label>
              <input
                id="handoff-note"
                type="text"
                className="form-input"
                placeholder="Short 1 yam — refunded at counter"
                value={handoffNote}
                onChange={(e) => setHandoffNote(e.target.value)}
                maxLength={200}
              />
            </div>
          ) : null}

          {isReady ? (
            <Button
              type="button"
              className="min-h-11 w-full"
              onClick={markCollected}
              disabled={pending !== null}
            >
              <PackageCheck className="h-4 w-4" aria-hidden />
              {pending === 'collected' ? 'Marking…' : 'Mark as picked up'}
            </Button>
          ) : (
            <Button
              type="button"
              className="min-h-11 w-full"
              onClick={markReady}
              disabled={pending !== null}
            >
              <PackageCheck className="h-4 w-4" aria-hidden />
              {pending === 'ready' ? 'Saving…' : 'Mark ready for pickup'}
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/admin/orders/${orderId}/print-slip`}
          className={cn(buttonVariants({ variant: 'outline' }), 'min-h-11 flex-1')}
        >
          <FileText className="h-4 w-4" aria-hidden />
          Bag ticket
        </Link>
        {customerEmail && !cancelled ? (
          <Button
            type="button"
            variant="outline"
            className="min-h-11 flex-1"
            onClick={resendNotice}
            disabled={pending !== null}
          >
            <Mail className="h-4 w-4" aria-hidden />
            {pending === 'notify' ? 'Sending…' : 'Resend notice'}
          </Button>
        ) : null}
      </div>

      {tel || sms ? (
        <div className="flex flex-wrap gap-2">
          {tel ? (
            <a href={tel} className={contactLink}>
              <Phone className="h-4 w-4" aria-hidden />
              Call
            </a>
          ) : null}
          {sms ? (
            <a href={sms} className={contactLink}>
              <MessageSquare className="h-4 w-4" aria-hidden />
              Text
            </a>
          ) : null}
        </div>
      ) : null}

      {customerEmail ? (
        <p className="text-xs text-earth-500">Notices go to {customerEmail}</p>
      ) : (
        <p className="text-xs text-earth-500">No email on file — call the customer instead.</p>
      )}

      {error ? <p className="error text-sm text-red-600">{error}</p> : null}
      {message ? (
        <p className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
          <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          {message}
        </p>
      ) : null}
    </div>
  )
}
