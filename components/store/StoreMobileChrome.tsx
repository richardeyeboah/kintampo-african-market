'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { getMobileStorePaddingClass } from '@/lib/constants/mobile-nav'
import { cn } from '@/lib/utils'

export function StoreMobileChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { totalItems } = useCart()

  return (
    <div className={cn('flex min-h-screen flex-col', getMobileStorePaddingClass(pathname, totalItems))}>
      {children}
    </div>
  )
}
