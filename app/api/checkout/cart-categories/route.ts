import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { assertSameOrigin } from '@/lib/security/same-origin'

export const runtime = 'nodejs'

/** Fresh product categories for cart tax (client cart may be stale). */
export async function POST(req: NextRequest) {
  const originCheck = assertSameOrigin(req)
  if (!originCheck.ok) return originCheck.response

  let body: { productIds?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const raw = Array.isArray(body.productIds) ? body.productIds : []
  const productIds = Array.from(
    new Set(
      raw
        .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
        .map((id) => id.trim())
    )
  ).slice(0, 50)

  if (productIds.length === 0) {
    return NextResponse.json({ categories: {} })
  }

  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id, category')
    .in('id', productIds)

  if (error) {
    console.error('[cart-categories]', error)
    return NextResponse.json({ error: 'Could not load categories.' }, { status: 500 })
  }

  const categories: Record<string, string> = {}
  for (const row of data ?? []) {
    if (row.id && row.category) categories[row.id] = String(row.category)
  }

  return NextResponse.json({ categories })
}
