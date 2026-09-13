/**
 * Kintampo storefront service worker.
 * - Enables installability (Chromium).
 * - Network-first for navigations; offline fallback only.
 * - Never caches checkout, cart, admin, APIs, or Stripe.
 */
const VERSION = 'kam-pwa-v2'
const SHELL_CACHE = `${VERSION}-shell`
const OFFLINE_URL = '/offline'

const PRECACHE = [OFFLINE_URL, '/icons/icon-192.png', '/icons/icon-512.png']

function isSensitive(pathname) {
  return (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/checkout') ||
    pathname === '/cart' ||
    pathname.startsWith('/cart/') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/account')
  )
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k.startsWith('kam-pwa-') && k !== SHELL_CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  if (isSensitive(url.pathname)) return

  // App shell / HTML navigations: network first, offline page fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => res)
        .catch(async () => {
          const cache = await caches.open(SHELL_CACHE)
          const offline = await cache.match(OFFLINE_URL)
          return offline || Response.error()
        })
    )
    return
  }

  // Static icons only — keep SW lean; do not cache Next chunks or product images
  if (url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async (cache) => {
        const cached = await cache.match(req)
        if (cached) return cached
        const res = await fetch(req)
        if (res.ok) cache.put(req, res.clone())
        return res
      })
    )
  }
})
