import { test, expect } from '@playwright/test'
import { whatsappHref } from '../lib/phone-link'

test.describe('whatsapp order links', () => {
  test('builds a wa.me link with a prefilled message', () => {
    const href = whatsappHref('6143778297', 'Hi, I would like to place an order:')
    expect(href).toBe(
      'https://wa.me/16143778297?text=Hi%2C%20I%20would%20like%20to%20place%20an%20order%3A'
    )
  })

  test('returns null when the number cannot be dialed', () => {
    expect(whatsappHref('abc')).toBeNull()
    expect(whatsappHref('')).toBeNull()
  })
})
