'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/store/PageHeader'
import { ReceiptActions } from '@/components/store/ReceiptActions'
import { ReceiptDocument } from '@/components/store/ReceiptDocument'
import {
  buildReceiptModel,
  type ReceiptItemInput,
  type ReceiptModel,
  type ReceiptOrderInput,
} from '@/lib/orders/receipt'

export function ReceiptClient() {
  const searchParams = useSearchParams()
  const [orderRef, setOrderRef] = useState(searchParams.get('id') ?? '')
  const [email, setEmail] = useState(searchParams.get('email') ?? '')
  const [model, setModel] = useState<ReceiptModel | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [attempted, setAttempted] = useState(false)

  const load = useCallback(async (ref: string, mail: string) => {
    if (!ref.trim()) return
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      params.set('id', ref.trim())
      if (mail.trim()) params.set('email', mail.trim())

      const res = await fetch(`/api/orders/track?${params.toString()}`)
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(payload.error ?? 'We could not find that order.')
        setModel(null)
        return
      }
      setModel(
        buildReceiptModel(
          payload.order as ReceiptOrderInput,
          (payload.items ?? []) as ReceiptItemInput[]
        )
      )
    } catch {
      setError('Network error. Try again.')
    } finally {
      setLoading(false)
      setAttempted(true)
    }
  }, [])

  useEffect(() => {
    const ref = searchParams.get('id')
    const mail = searchParams.get('email') ?? ''
    if (ref) void load(ref, mail)
    else setAttempted(true)
  }, [searchParams, load])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    void load(orderRef, email)
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="receipt-chrome">
        <PageHeader
          eyebrow="Orders"
          title="Your receipt"
          subtitle="Download it, print it, or show it at the counter."
        />
      </div>

      <div className="store-container py-8 sm:py-10">
        {!model && (
          <form onSubmit={handleSubmit} className="premium-card max-w-2xl space-y-4 p-6">
            <div>
              <label htmlFor="receipt-order" className="form-label">
                Order number
              </label>
              <Input
                id="receipt-order"
                value={orderRef}
                onChange={(e) => setOrderRef(e.target.value)}
                placeholder="LQ-1042"
                required
              />
            </div>
            <div>
              <label htmlFor="receipt-email" className="form-label">
                Email used at checkout
              </label>
              <Input
                id="receipt-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <Button type="submit" disabled={loading} className="min-h-11 w-full sm:w-auto">
              {loading ? 'Finding…' : 'Get receipt'}
            </Button>
            {error && attempted && <p className="error">{error}</p>}
          </form>
        )}

        {loading && !model && (
          <div className="mt-6 max-w-3xl space-y-3">
            <div className="h-40 animate-pulse rounded-2xl bg-earth-100" />
          </div>
        )}

        {model && (
          <div className="mx-auto max-w-3xl space-y-5">
            <div className="receipt-chrome">
              <ReceiptActions model={model} />
            </div>
            <ReceiptDocument model={model} />
            <div className="receipt-chrome">
              <Link
                href={`/track-order?id=${encodeURIComponent(model.orderLabel)}`}
                className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-700 no-underline hover:text-brand-900"
              >
                Track this order
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
