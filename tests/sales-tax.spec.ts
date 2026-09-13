import { test, expect } from '@playwright/test'
import {
  calculateSalesTax,
  isCategoryTaxable,
  shouldApplyStoreSalesTax,
} from '../lib/tax/sales-tax'

test.describe('Ohio category sales tax', () => {
  test('grocery categories are exempt', () => {
    expect(isCategoryTaxable('Beverages')).toBe(false)
    expect(isCategoryTaxable('Canned')).toBe(false)
    expect(isCategoryTaxable('Flours & Rice')).toBe(false)
    expect(isCategoryTaxable('Spices')).toBe(false)
  })

  test('cosmetics, non-food, alcohol, and fashion are taxable', () => {
    expect(isCategoryTaxable('Cosmetics')).toBe(true)
    expect(isCategoryTaxable('Non food')).toBe(true)
    expect(isCategoryTaxable('Alcohol')).toBe(true)
    expect(isCategoryTaxable('African Prints')).toBe(true)
    expect(isCategoryTaxable('Wax')).toBe(true)
    expect(isCategoryTaxable('Lace')).toBe(true)
    expect(isCategoryTaxable('Headtie')).toBe(true)
    expect(isCategoryTaxable('Kente')).toBe(true)
    expect(isCategoryTaxable('Brocade')).toBe(true)
    expect(isCategoryTaxable('Ready-to-wear')).toBe(true)
    expect(isCategoryTaxable('Hair & Braiding')).toBe(true)
  })

  test('tax applies for all US states on taxable items (Ohio store rate)', () => {
    expect(shouldApplyStoreSalesTax({ country: 'US', state: 'Ohio' })).toBe(true)
    expect(shouldApplyStoreSalesTax({ country: 'US', state: 'OH' })).toBe(true)
    expect(shouldApplyStoreSalesTax({ country: 'US', state: '' })).toBe(true)
    expect(shouldApplyStoreSalesTax({ shippingMethod: 'pickup' })).toBe(true)
    expect(shouldApplyStoreSalesTax({ country: 'US', state: 'Texas' })).toBe(true)
    expect(shouldApplyStoreSalesTax({ country: 'US', state: 'Michigan' })).toBe(true)
  })

  test('mixed cart taxes only taxable lines in Ohio', () => {
    const quote = calculateSalesTax(
      [
        { category: 'Beverages', lineSubtotal: 20 },
        { category: 'Cosmetics', lineSubtotal: 10 },
      ],
      { country: 'USA', state: 'OH' }
    )
    expect(quote.applies).toBe(true)
    expect(quote.taxableSubtotal).toBe(10)
    expect(quote.taxAmount).toBeGreaterThan(0)
    expect(quote.taxAmount).toBe(0.78)
  })

  test('out of state US still taxes non-food at store rate', () => {
    const quote = calculateSalesTax(
      [{ category: 'Non food', lineSubtotal: 15 }],
      { country: 'US', state: 'Michigan' }
    )
    expect(quote.applies).toBe(true)
    expect(quote.taxAmount).toBe(1.16)
  })

  test('Texas and California same tax as Ohio on cosmetics', () => {
    for (const state of ['Texas', 'California', 'New York']) {
      const quote = calculateSalesTax(
        [{ category: 'Cosmetics', lineSubtotal: 100 }],
        { country: 'United States', state }
      )
      expect(quote.applies, state).toBe(true)
      expect(quote.taxAmount, state).toBe(7.75)
    }
  })

  test('non-US orders have no sales tax on site', () => {
    const quote = calculateSalesTax(
      [{ category: 'Cosmetics', lineSubtotal: 20 }],
      { country: 'Canada', state: 'ON' }
    )
    expect(quote.taxAmount).toBe(0)
  })
})
