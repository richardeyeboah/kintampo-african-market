import { expect, test } from '@playwright/test'
import {
  getMobileStorePaddingClass,
  shouldShowMobileCartBar,
} from '../lib/constants/mobile-nav'

test.describe('Mobile chrome helpers', () => {
  test('hides floating cart bar on shop, cart, checkout, and product pages', () => {
    expect(shouldShowMobileCartBar('/shop', 2)).toBe(false)
    expect(shouldShowMobileCartBar('/cart', 2)).toBe(false)
    expect(shouldShowMobileCartBar('/checkout', 2)).toBe(false)
    expect(shouldShowMobileCartBar('/products/abc', 2)).toBe(false)
    expect(shouldShowMobileCartBar('/', 2)).toBe(true)
    expect(shouldShowMobileCartBar('/', 0)).toBe(false)
  })

  test('adds extra bottom padding when cart bar or product sticky is active', () => {
    expect(getMobileStorePaddingClass('/', 2)).toContain('3.5rem')
    expect(getMobileStorePaddingClass('/products/abc', 2)).toContain('3.75rem')
    expect(getMobileStorePaddingClass('/shop', 2)).not.toContain('3.5rem')
    expect(getMobileStorePaddingClass('/checkout', 2)).toContain('pb-8')
  })
})
