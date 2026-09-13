/**
 * Mobile viewport audit (storefront + optional deep links).
 *   node scripts/ops/audit-mobile.mjs
 *   BASE_URL=http://127.0.0.1:3000 node scripts/ops/audit-mobile.mjs
 */
import { chromium, devices } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'fs'
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

const paths = [
  '/',
  '/shop',
  '/cart',
  '/checkout',
  '/checkout/success',
  '/checkout/cancel',
  '/login',
  '/signup',
  '/forgot-password',
  '/track-order',
  '/receipt',
  '/faq',
  '/shipping',
  '/returns',
  '/about',
  '/recipes',
  '/bundles',
  '/account',
  '/account/wishlist',
  '/account/profile',
  '/account/addresses',
  '/account/password',
  '/feedback',
  '/privacy',
  '/terms',
  '/order-confirmation',
  '/verify-email',
]

const report = []

async function audit(path) {
  const issues = []
  const res = await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(1000)

  const status = res?.status() ?? 0
  if (status >= 400) issues.push(`HTTP ${status}`)

  const metrics = await page.evaluate(() => {
    const doc = document.documentElement
    const body = document.body
    const vw = window.innerWidth
    const scrollW = Math.max(doc.scrollWidth, body.scrollWidth)
    const overflowX = scrollW > vw + 1

    const wide = []
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect()
      if (r.width > vw + 2 && r.height > 0) {
        wide.push({
          tag: el.tagName.toLowerCase(),
          cls: typeof el.className === 'string' ? el.className.slice(0, 80) : '',
          w: Math.round(r.width),
        })
        if (wide.length >= 10) break
      }
    }

    const small = []
    for (const el of document.querySelectorAll('a, button, [role=button], input, select')) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      const style = getComputedStyle(el)
      if (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0') continue
      if (r.width < 44 || r.height < 44) {
        small.push({
          tag: el.tagName.toLowerCase(),
          label: (el.getAttribute('aria-label') || el.textContent || '')
            .trim()
            .replace(/\s+/g, ' ')
            .slice(0, 50),
          w: Math.round(r.width),
          h: Math.round(r.height),
        })
        if (small.length >= 15) break
      }
    }

    return {
      vw,
      scrollW,
      overflowX,
      wide,
      small,
      bottomNav: !!document.querySelector('nav[aria-label="Mobile navigation"]'),
      searchBar: !!document.querySelector('header input[placeholder*="Search"], header input[type="search"]'),
      h1: document.querySelector('h1')?.textContent?.trim()?.slice(0, 80) || null,
      title: document.title,
    }
  })

  if (metrics.overflowX) {
    issues.push(`horizontal overflow: scrollWidth=${metrics.scrollW} vw=${metrics.vw}`)
  }

  const safeName = path.replace(/\//g, '_').replace(/^_/, '') || 'home'
  const shot = resolve(outDir, `${safeName || 'home'}.png`)
  await page.screenshot({ path: shot, fullPage: false })

  report.push({ path, status, ...metrics, issues, shot })
  console.log(
    `${path.padEnd(28)} http=${status} overflow=${metrics.overflowX} search=${metrics.searchBar} small=${metrics.small.length}`
  )
}

for (const p of paths) {
  await audit(p)
}

// Deep links discovered from listings
await page.goto(BASE + '/shop', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(800)
const productHref = await page.locator('a[href^="/products/"]').first().getAttribute('href')
if (productHref) await audit(productHref)

await page.goto(BASE + '/recipes', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(800)
const recipeHref = await page.locator('a[href^="/recipes/"]').first().getAttribute('href')
if (recipeHref && recipeHref !== '/recipes') await audit(recipeHref)

await page.goto(BASE + '/bundles', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(800)
const bundleHref = await page.locator('a[href^="/bundles/"]').first().getAttribute('href')
if (bundleHref && bundleHref !== '/bundles') await audit(bundleHref)

await browser.close()
writeFileSync(resolve(outDir, 'report.json'), JSON.stringify(report, null, 2))

const overflowPages = report.filter((r) => r.overflowX)
const noSearch = report.filter((r) => !r.searchBar && !r.path.startsWith('/admin'))
console.log('\nWrote', resolve(outDir, 'report.json'))
console.log(`Overflow pages: ${overflowPages.length}`)
console.log(`Pages missing mobile search: ${noSearch.length}`)
if (overflowPages.length) {
  for (const r of overflowPages) console.log('  OVERFLOW', r.path)
}
