import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/store/PageHeader'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Offline',
  robots: { index: false, follow: false },
}

/** Shown when the PWA has no network for a navigation. */
export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-white">
      <PageHeader
        title="You're offline"
        subtitle="Reconnect to browse products and checkout."
      />
      <div className="store-container py-12 text-center">
        <Link href="/" className="inline-flex min-h-11 no-underline">
          <Button size="lg" className="rounded-xl">
            Try home
          </Button>
        </Link>
      </div>
    </div>
  )
}
