/** Bottom tab bar height (matches MobileBottomNav `h-[60px]` + safe area in layout padding). */
export const MOBILE_BOTTOM_NAV_HEIGHT_REM = 4

/** Floating “view cart” pill: `h-12` + `pb-2`. */
export const MOBILE_CART_BAR_HEIGHT_REM = 3.5

/** Product page sticky add bar (approx. bar + padding). */
export const MOBILE_PRODUCT_STICKY_BAR_HEIGHT_REM = 3.75

export const MOBILE_BOTTOM_NAV_OFFSET = `calc(${MOBILE_BOTTOM_NAV_HEIGHT_REM}rem + env(safe-area-inset-bottom, 0px))`

const SAFE_AREA = 'env(safe-area-inset-bottom,0px)'

/** @deprecated Use getMobileStorePaddingClass — kept for imports that only need the nav offset. */
export const MOBILE_BOTTOM_NAV_CLASS =
  `pb-[calc(${MOBILE_BOTTOM_NAV_HEIGHT_REM}rem+${SAFE_AREA})] md:pb-0`

/** Routes where the floating cart bar is redundant or overlaps other chrome. */
export function shouldShowMobileCartBar(pathname: string, totalItems: number): boolean {
  if (totalItems <= 0) return false
  if (pathname.startsWith('/cart') || pathname.startsWith('/checkout')) return false
  if (pathname.startsWith('/products/')) return false
  if (pathname === '/shop' || pathname === '/fashion') return false
  return true
}

export function getMobileStorePaddingClass(pathname: string, totalItems: number): string {
  if (pathname.startsWith('/checkout')) {
    return 'max-md:pb-8 md:pb-0'
  }

  let extraRem = 0
  if (shouldShowMobileCartBar(pathname, totalItems)) {
    extraRem = MOBILE_CART_BAR_HEIGHT_REM
  } else if (pathname.startsWith('/products/')) {
    extraRem = MOBILE_PRODUCT_STICKY_BAR_HEIGHT_REM
  }

  if (extraRem === 0) {
    return `pb-[calc(${MOBILE_BOTTOM_NAV_HEIGHT_REM}rem+${SAFE_AREA})] md:pb-0`
  }

  return `pb-[calc(${MOBILE_BOTTOM_NAV_HEIGHT_REM}rem+${extraRem}rem+${SAFE_AREA})] md:pb-0`
}
