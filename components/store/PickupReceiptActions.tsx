'use client'

import { useState } from 'react'
import { Download, Printer, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { STORE } from '@/lib/constants/store'
import {
  buildTextLabelPdfFile,
  canSharePdfFiles,
  downloadPdfFile,
} from '@/lib/client/share-label-pdf'

function buildReceiptFile(opts: {
  orderNumberLabel: string
  pickupContactName?: string | null
  total: number
}): File {
  const lines = [
    STORE.name.toUpperCase(),
    'PICKUP RECEIPT',
    '',
    `Order: ${opts.orderNumberLabel}`,
    ...(opts.pickupContactName ? [`Picking up: ${opts.pickupContactName}`] : []),
    '',
    `Total paid: $${opts.total.toFixed(2)}`,
    '',
    STORE.address,
    STORE.hours,
    STORE.phone,
    '',
    'Show this at the counter or give it to your driver.',
  ]
  return buildTextLabelPdfFile(lines, `pickup-receipt-${opts.orderNumberLabel}.pdf`)
}

export function PickupReceiptActions({
  orderNumberLabel,
  pickupContactName,
  total,
}: {
  orderNumberLabel: string
  pickupContactName?: string | null
  total: number
}) {
  const [error, setError] = useState('')
  const canShare = typeof window !== 'undefined' && canSharePdfFiles()

  async function handleShare() {
    setError('')
    try {
      const file = buildReceiptFile({ orderNumberLabel, pickupContactName, total })
      await navigator.share({ files: [file], title: `Pickup receipt — order ${orderNumberLabel}` })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError('Could not share the receipt. Try downloading it instead.')
    }
  }

  function handleDownload() {
    setError('')
    downloadPdfFile(buildReceiptFile({ orderNumberLabel, pickupContactName, total }))
  }

  function handlePrint() {
    setError('')
    const file = buildReceiptFile({ orderNumberLabel, pickupContactName, total })
    const url = URL.createObjectURL(file)
    window.open(url, '_blank', 'noopener')
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        {canShare && (
          <Button type="button" variant="outline" className="h-11" onClick={() => void handleShare()}>
            <Share2 className="mr-1.5 h-4 w-4" aria-hidden />
            Share receipt
          </Button>
        )}
        <Button type="button" variant="outline" className="h-11" onClick={handleDownload}>
          <Download className="mr-1.5 h-4 w-4" aria-hidden />
          Download
        </Button>
        <Button type="button" variant="outline" className="h-11" onClick={handlePrint}>
          <Printer className="mr-1.5 h-4 w-4" aria-hidden />
          Print
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
