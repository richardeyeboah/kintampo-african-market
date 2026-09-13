import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/require-admin-api'
import { assertSameOrigin } from '@/lib/security/same-origin'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const originCheck = assertSameOrigin(req)
  if (!originCheck.ok) return originCheck.response

  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  try {
    const body = await req.json()
    const ids: string[] = Array.isArray(body.ids) ? body.ids.slice(0, 200) : []
    const inStock = typeof body.in_stock === 'boolean' ? body.in_stock : null

    if (!ids.length || inStock === null) {
      return NextResponse.json({ error: 'ids and in_stock are required.' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('products')
      .update({ in_stock: inStock })
      .in('id', ids)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, updated: ids.length })
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
