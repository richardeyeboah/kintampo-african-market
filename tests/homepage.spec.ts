import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('sets document title', async ({ page }) => {
    await expect(page).toHaveTitle(/Kintampo/i)
  })

  test('shows hero heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /African.*Caribbean groceries/i })
    ).toBeVisible()
  })

  test('shows hero search input', async ({ page }) => {
    const search = page.getByRole('search').first().getByRole('searchbox')
    await expect(search.first()).toBeVisible()
  })

  test('shows Shop by category section', async ({ page }) => {
    await expect(
      page.getByRole('main').getByRole('heading', { name: /Shop by category/i })
    ).toBeVisible()
  })

  test('shows Trending this week section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Trending this week/i })).toBeVisible()
  })

  test('Shop all products links to /shop', async ({ page }) => {
    const cta = page
      .getByRole('link', { name: /Shop all products/i })
      .first()
    await expect(cta).toBeVisible()
    await expect(cta).toHaveAttribute('href', '/shop')
  })
})
