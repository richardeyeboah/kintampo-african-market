'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FlashLabelPdfActions } from '@/components/admin/FlashLabelPdfActions'
import { buildTextLabelPdfFile } from '@/lib/client/share-label-pdf'
import {
  buildPickupTicketPdfFile,
  type PickupTicketPdfData,
} from '@/lib/client/pickup-ticket-pdf'
import { cn } from '@/lib/utils'

export type SlipSharePayload = {
  name: string
  lines: string[]
  orderLabel: string
  phone?: string | null
  shipFromLines: string[]
}

export type PaperSize = 'label' | 'letter'

/**
 * `@page` size cannot be switched with a class, so the rule is injected as its
 * own stylesheet. Without this the browser lays out US Letter and the printer
 * shrinks the whole page onto a 4x6 label, which is why tickets came out tiny.
 */
const PAGE_RULE: Record<PaperSize, string> = {
  label: '@media print { @page { size: 100mm 150mm; margin: 3mm; } }',
  letter: '@media print { @page { size: letter portrait; margin: 0.5in; } }',
}

const PAPER_LABEL: Record<PaperSize, string> = {
  label: '4×6 label',
  letter: 'Letter',
}

const STORAGE_KEY = 'lq_admin_print_paper'

function slipToPdfFile(payload: SlipSharePayload): File {
  const lines = [
    'SHIP TO',
    '',
    payload.name,
    ...payload.lines,
    ...(payload.phone ? [`Phone: ${payload.phone}`] : []),
    '',
    `Order: ${payload.orderLabel}`,
    '',
    'SHIP FROM',
    ...payload.shipFromLines,
  ]
  return buildTextLabelPdfFile(lines, `address-slip-${payload.orderLabel}.pdf`)
}

export function PrintSlipActions({
  orderId,
  autoPrint,
  sharePayload,
  ticketPayload,
  defaultPaper = 'letter',
}: {
  orderId: string
  autoPrint?: boolean
  sharePayload?: SlipSharePayload
  ticketPayload?: PickupTicketPdfData
  defaultPaper?: PaperSize
}) {
  const [paper, setPaper] = useState<PaperSize>(defaultPaper)

  useEffect(() => {
    const stored = window.localStorage.getItem(`${STORAGE_KEY}_${defaultPaper}`)
    if (stored === 'label' || stored === 'letter') setPaper(stored)
  }, [defaultPaper])

  useEffect(() => {
    document.body.classList.add('admin-print-slip-page')
    return () => document.body.classList.remove('admin-print-slip-page')
  }, [])

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = PAGE_RULE[paper]
    document.head.appendChild(style)

    const bodyClass = paper === 'label' ? 'paper-label' : 'paper-letter'
    document.body.classList.add(bodyClass)

    return () => {
      style.remove()
      document.body.classList.remove(bodyClass)
    }
  }, [paper])

  function choosePaper(next: PaperSize) {
    setPaper(next)
    window.localStorage.setItem(`${STORAGE_KEY}_${defaultPaper}`, next)
  }

  useEffect(() => {
    if (!autoPrint) return
    const t = window.setTimeout(() => window.print(), 600)
    return () => window.clearTimeout(t)
  }, [autoPrint])

  return (
    <div className="print-slip-toolbar mb-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/admin/orders/${orderId}`}
          className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-earth-600 no-underline hover:text-earth-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to order
        </Link>
        <Button type="button" variant="outline" onClick={() => window.print()}>
          <Printer className="mr-1.5 h-4 w-4" aria-hidden />
          Print
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-earth-500">Paper</span>
        <div className="flex gap-1 rounded-lg border border-earth-200 p-1">
          {(['label', 'letter'] as PaperSize[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => choosePaper(option)}
              aria-pressed={paper === option}
              className={cn(
                'min-h-11 rounded-md px-3 text-sm font-medium transition-colors duration-150',
                paper === option
                  ? 'bg-earth-900 text-white'
                  : 'text-earth-600 hover:bg-earth-50 hover:text-earth-900'
              )}
            >
              {PAPER_LABEL[option]}
            </button>
          ))}
        </div>
        <span className="text-xs text-earth-400">
          {paper === 'label'
            ? 'Set the printer to 100mm × 150mm and scale to 100%.'
            : 'Standard 8.5 × 11 sheet.'}
        </span>
      </div>

      {sharePayload ? (
        <FlashLabelPdfActions
          orderId={orderId}
          tracking={sharePayload.orderLabel}
          kind="address-slip"
          getFile={async () => slipToPdfFile(sharePayload)}
        />
      ) : null}

      {ticketPayload ? (
        <div className="rounded-lg border border-earth-200 bg-earth-50/60 p-3">
          <p className="mb-2 text-xs font-medium text-earth-600">
            Exact 4×6 PDF — prints at true size with no dialog scaling.
          </p>
          <FlashLabelPdfActions
            orderId={orderId}
            tracking={ticketPayload.orderLabel}
            kind="pickup-ticket"
            getFile={async () => buildPickupTicketPdfFile(ticketPayload)}
          />
        </div>
      ) : null}
    </div>
  )
}
