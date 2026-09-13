'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Next.js App Router error boundary for the store segment.
 * Shown when a server component throws (e.g. Supabase is unreachable).
 * Users get a friendly message and can retry without seeing a raw crash.
 */
export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to your monitoring service here (e.g. Sentry, Datadog).
    console.error('[store-error-boundary]', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-earth-100">
        <AlertTriangle className="h-7 w-7 text-earth-500" strokeWidth={1.5} aria-hidden />
      </div>

      <h1 className="mt-5 text-xl font-semibold tracking-tight text-earth-900 sm:text-2xl">
        Something went wrong
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-earth-600">
        We couldn&apos;t load this page right now. Please try again — it&apos;s usually a
        temporary issue.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button onClick={reset} size="lg" className="h-11 px-6">
          Try again
        </Button>
        <Link href="/" className="no-underline">
          <Button variant="outline" size="lg" className="h-11 px-6">
            Go home
          </Button>
        </Link>
      </div>

      {error.digest && (
        <p className="mt-6 font-mono text-[11px] text-earth-400">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  )
}
