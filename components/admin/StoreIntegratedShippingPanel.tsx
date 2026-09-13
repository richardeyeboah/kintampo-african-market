'use client'

import Link from 'next/link'
import { Printer } from 'lucide-react'
import { UspsPrintLabelPanel } from '@/components/admin/UspsPrintLabelPanel'

type Props = {
  orderId: string
  mailClass: string
  labelsLive: boolean
  uspsConfigured: boolean
  shippoConfigured?: boolean
  defaultParcel: {
    weightLb: number
    lengthIn: number
    widthIn: number
    heightIn: number
  }
  initialLabelUrl?: string | null
  initialTracking?: string | null
}

export function StoreIntegratedShippingPanel({
  orderId,
  mailClass,
  labelsLive,
  uspsConfigured,
  shippoConfigured,
  defaultParcel,
  initialLabelUrl,
  initialTracking,
}: Props) {
  if (shippoConfigured || (labelsLive && uspsConfigured)) {
    return (
      <UspsPrintLabelPanel
        orderId={orderId}
        mailClass={mailClass}
        defaultParcel={defaultParcel}
        initialLabelUrl={initialLabelUrl}
        initialTracking={initialTracking}
      />
    )
  }

  return (
    <div className="rounded-xl border border-earth-200 bg-earth-50 px-5 py-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-earth-100">
        <Printer className="h-6 w-6 text-earth-500" aria-hidden />
      </div>
      <p className="mt-3 text-sm font-medium text-earth-800">Label printing unavailable</p>
      <p className="mt-1 text-xs text-earth-500">Add tracking on this order after you ship.</p>
      <p className="mt-3">
        <Link
          href="/admin/shipping"
          className="text-sm font-medium text-brand-700 no-underline hover:text-brand-800"
        >
          Shipping settings →
        </Link>
      </p>
    </div>
  )
}
