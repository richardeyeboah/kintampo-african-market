import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const TAP =
  'inline-flex min-h-11 items-center font-medium text-brand-700 no-underline hover:text-brand-800'

/** Inline text link with ≥44px tap height for mobile. */
export function TapLink({
  href,
  children,
  className,
  external,
}: {
  href: string
  children: ReactNode
  className?: string
  external?: boolean
}) {
  if (external || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return (
      <a
        href={href}
        className={cn(TAP, className)}
        {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className={cn(TAP, className)}>
      {children}
    </Link>
  )
}
