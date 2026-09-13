import { getSupportEmail, STORE, STORE_PHONES } from '@/lib/constants/store'
import { SOCIAL_SAME_AS } from '@/lib/constants/social'
import { getPublicSiteUrl } from '@/lib/site-url'

/** Structured data for Google local / knowledge panel (homepage + store pages). */
export function LocalBusinessJsonLd() {
  const siteUrl = getPublicSiteUrl()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'GroceryStore',
    '@id': `${siteUrl}/#store`,
    name: STORE.name,
    alternateName: STORE.shortName,
    description: STORE.tagline,
    url: siteUrl,
    telephone: STORE_PHONES.map((p) => p.href.replace('tel:', '')),
    email: getSupportEmail(),
    image: `${siteUrl}/brand/logo-reference.png`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: STORE.address,
      addressLocality: 'Columbus',
      addressRegion: 'OH',
      postalCode: '43229',
      addressCountry: 'US',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '09:00',
        closes: '20:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Sunday',
        opens: '10:00',
        closes: '18:00',
      },
    ],
    priceRange: '$$',
    servesCuisine: ['African', 'Caribbean'],
    sameAs: SOCIAL_SAME_AS,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
