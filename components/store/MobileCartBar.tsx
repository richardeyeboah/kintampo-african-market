'use client'

import { usePathname } from 'next/navigation'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { Button } from '@/components/ui/button'
import {
  MOBILE_BOTTOM_NAV_OFFSET,
  shouldShowMobileCartBar,
} from '@/lib/constants/mobile-nav'
import { formatMoney } from '@/lib/utils'

export function MobileCartBar() {
  const { totalItems, totalPrice, openCart } = useCart()
  const pathname = usePathname()

  if (!shouldShowMobileCartBar(pathname, totalItems)) return null

  return (
    <div
      className="animate-fade-in fixed left-0 right-0 z-40 px-3 pb-2 md:hidden"
      style={{ bottom: MOBILE_BOTTOM_NAV_OFFSET }}
    >
      <Button
        type="button"
        size="lg"
        className="h-12 w-full gap-2.5 rounded-xl text-sm font-semibold shadow-[var(--shadow-card-hover)]"
        onClick={openCart}
      >
        <ShoppingBag className="h-4 w-4" aria-hidden />
        <span className="flex-1 text-left">
          {totalItems} item{totalItems === 1 ? '' : 's'} · view cart
        </span>
        <span className="font-semibold tabular-nums">{formatMoney(totalPrice)}</span>
      </Button>
    </div>
  )
}
