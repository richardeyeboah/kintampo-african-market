/**
 * Mobile checkout smoke: add a product, open checkout, screenshot pickup/tip UI.
 *   node scripts/ops/audit-checkout-mobile.mjs
 */
import { chromium, devices } from '@playwright/test'
import { mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../..')
const BASE = (process.env.BASE_URL || 'https://kintampoafricanmarket.com').replace(/\/$/, '')
const outDir = resolve(ROOT, 'tmp', 'mobile-audit')
mkdirSync(outDir, { recursive: true })

const phone = devices['iPhone 13']
const browser = await chromium.launch()
const context = await browser.newContext({ ...phone })
const page = await context.newPage()

const issues = []

await page.goto(BASE + '/shop', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(1500)

const addBtn = page.getByRole('button', { name: /Add .* to cart|Add to cart/i }).first()
if ((await addBtn.count()) === 0) {
  issues.push('No add-to-cart button on shop')
} else {
  await addBtn.click()
  await page.waitForTimeout(800)
}

await page.goto(BASE + '/checkout', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(1500)

const empty = await page.getByText('Your cart is empty').count()
if (empty > 0) {
  issues.push('Checkout still empty after add-to-cart')
}

const pickup = page.getByText('Store Pickup', { exact: false })
const local = page.getByText('Local Delivery', { exact: false })
const sub = page.getByText('If an item is unavailable', { exact: false })

const hasPickup = (await pickup.count()) > 0
const hasLocal = (await local.count()) > 0
const hasSub = (await sub.count()) > 0

if (!hasPickup) issues.push('Missing Store Pickup option')
if (!hasLocal) issues.push('Missing Local Delivery option')
if (!hasSub) issues.push('Missing substitution preference block')

await page.screenshot({ path: resolve(outDir, 'checkout-with-cart.png'), fullPage: false })

// Select pickup → expect pickup window radios
if (hasPickup) {
  await page.locator('label').filter({ hasText: /Store Pickup/i }).first().click()
  await page.waitForTimeout(400)
  const windowLabel = page.getByText('Pickup window', { exact: false })
  if ((await windowLabel.count()) === 0) {
    issues.push('Pickup window not shown after selecting pickup')
  }
  await page.screenshot({ path: resolve(outDir, 'checkout-pickup.png'), fullPage: true })
}

// Select local delivery → tip presets (may need address; tip UI should still show)
if (hasLocal) {
  await page.locator('label').filter({ hasText: /Local Delivery/i }).first().click()
  await page.waitForTimeout(400)
  const tip = page.getByText('Driver tip', { exact: false })
  if ((await tip.count()) === 0) {
    issues.push('Driver tip not shown for local delivery')
  }
  const minWarn = page.getByText(/minimum/i)
  // tip or min warning both ok depending on cart total
  await page.screenshot({ path: resolve(outDir, 'checkout-local.png'), fullPage: true })
  if ((await tip.count()) === 0 && (await minWarn.count()) === 0) {
    issues.push('Neither tip nor delivery minimum message for local delivery')
  }
}

const overflow = await page.evaluate(() => {
  const vw = window.innerWidth
  return document.documentElement.scrollWidth > vw + 1
})
if (overflow) issues.push('Horizontal overflow on checkout')

console.log(JSON.stringify({ empty: empty > 0, hasPickup, hasLocal, hasSub, overflow, issues }, null, 2))
await browser.close()
if (issues.length) process.exitCode = 1
