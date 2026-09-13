import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/require-admin-api'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

/** Product picker for the phone-order desk. Includes out-of-stock items. */
export async function GET(req: NextRequest) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  // Commas/parens are PostgREST filter syntax and would break the .or() below.
  const q = (req.nextUrl.searchParams.get('q') ?? '')
    .replace(/[,()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
  if (q.length < 1) {
    return NextResponse.json({ products: [] })
  }

  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id, name, price, category, in_stock, image_url')
    .or(`name.ilike.%${q}%,category.ilike.%${q}%`)
    .order('name', { ascending: true })
    .limit(20)

  if (error) {
    console.error('[admin product search]', error.message)
    return NextResponse.json({ error: 'Search failed.' }, { status: 500 })
  }

  return NextResponse.json({
    products: (data ?? []).map((p) => ({
      id: p.id as string,
      name: String(p.name ?? ''),
      price: Number(p.price ?? 0),
      category: String(p.category ?? ''),
      inStock: Boolean(p.in_stock),
      imageUrl: (p.image_url as string | null) ?? null,
    })),
  })
}
