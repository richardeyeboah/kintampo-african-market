import Link from 'next/link'
import type { ReactNode } from 'react'
import { Store } from 'lucide-react'
import { STORE } from '@/lib/constants/store'

type AuthShellProps = {
  title: string
  subtitle?: string
  children: ReactNode
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-earth-50">
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-10 sm:px-6 lg:py-14">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-4 inline-flex min-h-11 items-center gap-2 no-underline"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-700 text-white">
              <Store className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-base font-semibold text-earth-900">
              {STORE.shortName}
            </span>
          </Link>
          <div className="rounded-xl border border-earth-200 bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
            <h1 className="text-2xl font-semibold tracking-tight text-earth-900 sm:text-[1.75rem]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1.5 text-sm text-earth-600">{subtitle}</p>
            )}
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
