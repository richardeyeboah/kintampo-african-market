'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function AdminShellContent({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === '/admin/login'

  return (
    <main
      className={cn(
        isLogin
          ? 'min-h-screen w-full bg-slate-50'
          : 'admin-content'
      )}
    >
      {children}
    </main>
  )
}
