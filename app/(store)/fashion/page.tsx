import type { Metadata } from 'next'
import { ShopCatalog } from '@/components/shop/ShopCatalog'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Fashion',
  description: 'Clothes, fabric & hair — African prints, lace, ready-to-wear and braiding supplies.',
}

/**
 * Fashion department hub — same store/cart as grocery.
 */
export default async function FashionPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    category?: string
    brand?: string
    dietary?: string
    minPrice?: string
    maxPrice?: string
    inStock?: string
    sort?: string
  }>
}) {
  const p = await searchParams
  return <ShopCatalog params={p} dept="fashion" />
}
