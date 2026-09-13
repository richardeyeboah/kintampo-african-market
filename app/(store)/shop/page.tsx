import { redirect } from 'next/navigation'
import { ShopCatalog } from '@/components/shop/ShopCatalog'
import { parseShopDept } from '@/lib/constants/categories'

export const dynamic = 'force-dynamic'

export default async function ShopPage({
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
    dept?: string
  }>
}) {
  const p = await searchParams
  const dept = parseShopDept(p.dept)

  // Canonical fashion hub is /fashion — keep ?dept=fashion working as an alias.
  if (dept === 'fashion') {
    const next = new URLSearchParams()
    for (const [key, value] of Object.entries(p)) {
      if (key === 'dept' || value == null || value === '') continue
      next.set(key, value)
    }
    redirect(next.toString() ? `/fashion?${next.toString()}` : '/fashion')
  }

  return <ShopCatalog params={p} dept={null} />
}
