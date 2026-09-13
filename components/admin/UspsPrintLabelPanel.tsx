'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FlashLabelPdfActions } from '@/components/admin/FlashLabelPdfActions'

type Parcel = {
  weightLb: number
  lengthIn: number
  widthIn: number
  heightIn: number
}

type Props = {
  orderId: string
  mailClass: string
  defaultParcel: Parcel
  initialLabelUrl?: string | null
  initialTracking?: string | null
}

export function UspsPrintLabelPanel({
  orderId,
  mailClass,
  defaultParcel,
  initialLabelUrl,
  initialTracking,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [labelUrl, setLabelUrl] = useState(initialLabelUrl ?? '')
  const [tracking, setTracking] = useState(initialTracking ?? '')
  const [pdfBase64, setPdfBase64] = useState<string | null>(null)
  const [postage, setPostage] = useState<number | null>(null)
  const [customerNotified, setCustomerNotified] = useState(false)
  const [estimate, setEstimate] = useState<{ price: number; description: string } | null>(null)
  const [rateError, setRateError] = useState('')
  const [rateLoading, setRateLoading] = useState(false)
  const [parcel, setParcel] = useState<Parcel>(defaultParcel)

  function updateParcel(field: keyof Parcel, raw: string) {
    const val = parseFloat(raw)
    if (Number.isFinite(val) && val > 0) {
      setParcel((p) => ({ ...p, [field]: val }))
      setEstimate(null)
    }
  }

  async function loadRate(p = parcel) {
    setRateLoading(true)
    setRateError('')
    setEstimate(null)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/shipping/usps-rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parcel: p }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setRateError(typeof data.error === 'string' ? data.error : 'Could not load rate estimate.')
        return
      }
      if (typeof data.price === 'number') {
        setEstimate({ price: data.price, description: data.description ?? 'USPS' })
      }
    } catch {
      setRateError('Could not load rate estimate.')
    } finally {
      setRateLoading(false)
    }
  }

  useEffect(() => {
    if (!labelUrl) void loadRate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function createLabel() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/shipping/usps-label`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parcel }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Could not create label.')
        return
      }

      setTracking(typeof data.trackingNumber === 'string' ? data.trackingNumber : '')
      setPostage(typeof data.postage === 'number' ? data.postage : null)
      setCustomerNotified(data.customerNotified === true)
      if (typeof data.labelUrl === 'string') setLabelUrl(data.labelUrl)
      if (typeof data.labelPdfBase64 === 'string') setPdfBase64(data.labelPdfBase64)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  if (labelUrl || tracking || pdfBase64) {
    return (
      <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
        <p className="text-sm font-semibold text-emerald-900">Label ready</p>
        {postage != null ? <p className="text-sm text-emerald-800">Postage: ${postage.toFixed(2)}</p> : null}
        {tracking ? (
          <p className="font-mono text-xs text-emerald-900">
            Tracking: <span className="font-semibold">{tracking}</span>
          </p>
        ) : null}
        {customerNotified ? (
          <p className="text-sm text-emerald-800">Customer emailed with tracking.</p>
        ) : null}
        <FlashLabelPdfActions
          orderId={orderId}
          labelUrl={labelUrl}
          pdfBase64={pdfBase64}
          tracking={tracking}
          kind="label"
          className="mt-2"
        />
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-xl border border-brand-300 bg-white p-5 shadow-[var(--shadow-card)]">
      <div>
        <p className="text-base font-semibold text-earth-900">Create shipping label</p>
        <p className="mt-0.5 text-sm text-earth-500">
          {mailClass.replace(/_/g, ' ')} · Marks order shipped and emails the customer with tracking
        </p>
      </div>

      <div className="space-y-3 rounded-lg border border-earth-200 bg-earth-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-earth-500">Box dimensions</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              { field: 'weightLb', label: 'Weight (lb)' },
              { field: 'lengthIn', label: 'Length (in)' },
              { field: 'widthIn', label: 'Width (in)' },
              { field: 'heightIn', label: 'Height (in)' },
            ] as const
          ).map(({ field, label }) => (
            <label key={field} className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-earth-500">{label}</span>
              <input
                type="number"
                min="0.1"
                step="0.1"
                defaultValue={parcel[field]}
                onBlur={(e) => updateParcel(field, e.target.value)}
                className="form-input py-1.5 text-sm"
              />
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={() => loadRate()}
          disabled={rateLoading}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800 disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', rateLoading && 'animate-spin')} />
          {rateLoading ? 'Getting rate…' : 'Get rate estimate'}
        </button>
      </div>

      {estimate && (
        <p className="text-sm font-semibold text-earth-900">
          Estimated postage: <span className="text-brand-700">${estimate.price.toFixed(2)}</span>
          <span className="ml-1 font-normal text-earth-500">· {estimate.description}</span>
        </p>
      )}
      {rateError && <p className="text-xs font-medium text-amber-800">{rateError}</p>}
      {error && (
        <p className="text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      )}

      <Button
        type="button"
        size="lg"
        className="h-12 w-full sm:w-auto"
        onClick={() => void createLabel()}
        disabled={loading}
      >
        {loading ? 'Creating label…' : 'Create shipping label'}
      </Button>
    </div>
  )
}
