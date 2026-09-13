import type { MetadataRoute } from 'next'
import { STORE } from '@/lib/constants/store'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: STORE.name,
    short_name: 'Kintampo',
    description: STORE.tagline,
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#fafafa',
    theme_color: '#ce1126',
    categories: ['shopping', 'food'],
    lang: 'en-US',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
