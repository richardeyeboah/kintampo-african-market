/**
 * Authenticated admin mobile + desktop smoke audit.
 *   node --env-file=.env.local scripts/ops/audit-admin.mjs
 *   BASE_URL=https://kintampoafricanmarket.com node --env-file=.env.local scripts/ops/audit-admin.mjs
 */
import { chromium, devices } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = resolve(ROOT, 'tmp', 'admin-audit')
const BASE = (process.env.BASE_URL || 'https://kintampoafricanmarket.com').replace(/\/$/, '')
const password = process.env.ADMIN_PASSWORD?.trim()
if (!password) throw new Error('ADMIN_PASSWORD is required')

mkdirSync(OUT, { recursive: true })

const routes = [
  ['/admin/login', 'login'],
  ['/admin', 'overview'],
  ['/admin/orders', 'orders'],
  ['/admin/orders?queue=needs_action', 'orders-queue'],
  ['/admin/orders/new', 'orders-new'],
  ['/admin/products', 'products'],
  ['/admin/products/new', 'products-new'],
  ['/admin/products/descriptions', 'products-descriptions'],
  ['/admin/customers', 'customers'],
  ['/admin/shipping', 'shipping'],
  ['/admin/reviews', 'reviews'],
  ['/admin/announcements', 'announcements'],
]

function isAdminAuthedUrl(url) {
  try {
    const path = new URL(url).pathname
    return path === '/admin' || (path.startsWith('/admin/') && !path.startsWith('/admin/login'))
  } catch {
    return false
  }
}

async function signIn(page) {
  await page.goto(`${BASE}/admin/login`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  // Already signed in (cookie reuse) → redirected away from login
  if (isAdminAuthedUrl(page.url())) return
  await page.locator('#staff-pass').fill(password)
  await Promise.all([
    page.waitForURL((url) => isAdminAuthedUrl(url), { timeout: 60000 }),
    page.getByRole('button', { name: 'Sign in' }).click(),
  ])
}

async function auditPath(page, path, file, name) {
  const res = await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(800)
  const status = res?.status() ?? 0

  const metrics = await page.evaluate(() => {
    const vw = window.innerWidth
    const scrollW = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)
    const small = []
    for (const el of document.querySelectorAll('a, button, [role=button], input, select, textarea')) {
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
        if (small.length >= 12) break
      }
    }
    return {
      viewport: vw,
      scrollWidth: scrollW,
      overflow: scrollW > vw + 1,
      title: document.querySelector('h1')?.textContent?.trim() ?? null,
      bodyText: document.body?.innerText?.slice(0, 120) ?? '',
      small,
    }
  })

  const issues = []
  if (status >= 400) issues.push(`HTTP ${status}`)
  if (metrics.overflow) issues.push('horizontal overflow')
  if (/sign in|staff password|unauthorized/i.test(metrics.bodyText) && path !== '/admin/login') {
    issues.push('looks like login wall')
  }

  await page.screenshot({
    path: resolve(OUT, `${file}-${name}.png`),
    fullPage: false,
  })

  console.log(
    `${name.padEnd(7)} ${path.padEnd(36)} http=${status} overflow=${metrics.overflow} small=${metrics.small.length}${issues.length ? ' ⚠ ' + issues.join('; ') : ''}`
  )

  return { path, status, ...metrics, issues }
}

async function runViewport(browser, name, options) {
  const context = await browser.newContext(options)
  const page = await context.newPage()
  const results = []

  // Login page first (before session)
  results.push(await auditPath(page, '/admin/login', 'login', name))

  await signIn(page)

  for (const [path, file] of routes) {
    if (path === '/admin/login') continue
    results.push(await auditPath(page, path, file, name))
  }

  // Deep links: first order + first product edit if present
  await page.goto(`${BASE}/admin/orders`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(600)
  const orderHref = await page.locator('a[href^="/admin/orders/"]').first().getAttribute('href')
  if (orderHref && !orderHref.includes('/new') && !orderHref.includes('print-slip')) {
    results.push(await auditPath(page, orderHref, 'order-detail', name))
    const printHref = orderHref.replace(/\/?$/, '') + '/print-slip'
    results.push(await auditPath(page, printHref, 'order-print-slip', name))
  }

  await page.goto(`${BASE}/admin/products`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(600)
  const editHref = await page.locator('a[href*="/admin/products/"][href*="/edit"]').first().getAttribute('href')
  if (editHref) {
    results.push(await auditPath(page, editHref, 'product-edit', name))
  }

  await page.goto(`${BASE}/admin/customers`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(600)
  const custHref = await page.locator('a[href^="/admin/customers/"]').first().getAttribute('href')
  if (custHref) {
    results.push(await auditPath(page, custHref, 'customer-detail', name))
  }

  await context.close()
  return results
}

const browser = await chromium.launch()
const desktop = await runViewport(browser, 'desktop', { viewport: { width: 1440, height: 960 } })
const mobile = await runViewport(browser, 'mobile', { ...devices['iPhone 13'] })
await browser.close()

writeFileSync(resolve(OUT, 'report.json'), JSON.stringify({ desktop, mobile }, null, 2))

const bad = [...desktop, ...mobile].filter((r) => r.issues?.length || r.overflow)
console.log('\nWrote', resolve(OUT, 'report.json'))
console.log(`Pages with issues: ${bad.length}`)
for (const r of bad) {
  console.log(' ', r.path, r.issues?.join(', ') || 'overflow')
}
