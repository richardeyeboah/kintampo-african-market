import { NextResponse } from 'next/server'
import { fashionQueryCategories, parseShopDept } from '@/lib/constants/categories'
import { searchProductsLite } from '@/lib/supabase/products'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const q = url.searchParams.get('q') ?? ''
  const limitParam = url.searchParams.get('limit')
  const limit = Math.min(Math.max(parseInt(limitParam ?? '6', 10) || 6, 1), 10)
  const dept = parseShopDept(url.searchParams.get('dept'))
  const categories = dept === 'fashion' ? fashionQueryCategories() : undefined

  const products = await searchProductsLite(q, limit, { categories })
  return NextResponse.json(
    {
      query: q,
      dept,
      count: products.length,
      products,
    },
    {
      headers: {
        // Short edge cache so duplicate keystroke variations are cheap.
        'Cache-Control': 'private, max-age=15, s-maxage=15',
      },
    }
  )
}
