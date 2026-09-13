import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ReceiptClient } from './ReceiptClient'
import './receipt.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Receipt',
  robots: { index: false, follow: false },
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-earth-500">Loading…</p>}>
      <ReceiptClient />
    </Suspense>
  )
}
