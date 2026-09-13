'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import {
  Heart,
  KeyRound,
  LayoutDashboard,
  MapPin,
  Package,
  UserCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type NavItem = {
  href: string
  label: string
  icon: typeof LayoutDashboard
  exact?: boolean
}

const NAV: NavItem[] = [
  { href: '/account', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/account/profile', label: 'Profile', icon: UserCircle },
  { href: '/account/addresses', label: 'Addresses', icon: MapPin },
  { href: '/account/password', label: 'Password', icon: KeyRound },
  { href: '/track-order', label: 'Track order', icon: Package },
]

export function AccountShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-cream">
      <div className="store-container py-8 sm:py-10 lg:py-12">
        <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12">
          <aside>
            <p className="text-xs font-bold uppercase tracking-wider text-earth-500">Account</p>
            <nav className="mt-4 space-y-1" aria-label="Account">
              {NAV.map((item) => {
                const { href, label, icon: Icon } = item
                const active = item.exact ? pathname === href : pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold no-underline transition',
                      active
                        ? 'bg-brand-50 text-brand-800'
                        : 'text-earth-700 hover:bg-white hover:text-earth-950'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    {label}
                  </Link>
                )
              })}
            </nav>
          </aside>
          <div className="mt-8 lg:mt-0">{children}</div>
        </div>
      </div>
    </div>
  )
}
