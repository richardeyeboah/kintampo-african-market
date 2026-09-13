import type { MetadataRoute } from 'next'
import { getPublicSiteUrl } from '@/lib/site-url'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getPublicSiteUrl()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Auth-gated, transactional, or admin paths shouldn't appear in search results.
        disallow: [
          '/admin',
          '/admin/',
          '/api/',
          '/account',
          '/account/',
          '/cart',
          '/checkout',
          '/checkout/',
          '/order-confirmation',
          '/track-order',
          '/login',
          '/signup',
          '/forgot-password',
          '/verify-email',
          '/auth/',
          '/reset-password',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
