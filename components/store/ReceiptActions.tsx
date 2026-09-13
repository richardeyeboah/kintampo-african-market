'use client'

import { Download, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { downloadReceiptPdf } from '@/lib/client/receipt-pdf'
import { buildReceiptPdfLines, receiptFileName, type ReceiptModel } from '@/lib/orders/receipt'

export function ReceiptActions({ model }: { model: ReceiptModel }) {
  return (
    <div className="receipt-actions flex flex-wrap gap-2">
      <Button
        type="button"
        className="min-h-11"
        onClick={() => downloadReceiptPdf(buildReceiptPdfLines(model), receiptFileName(model))}
      >
        <Download className="h-4 w-4" aria-hidden />
        Download receipt
      </Button>
      <Button type="button" variant="outline" className="min-h-11" onClick={() => window.print()}>
        <Printer className="h-4 w-4" aria-hidden />
        Print
      </Button>
    </div>
  )
}
