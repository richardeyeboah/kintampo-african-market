import { Suspense } from 'react'
import { TrackOrderClient } from './TrackOrderClient'

export const dynamic = 'force-dynamic'

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-earth-500">Loading…</p>}>
      <TrackOrderClient />
    </Suspense>
  )
}
