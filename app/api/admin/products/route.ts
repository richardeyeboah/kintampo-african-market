import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/require-admin-api'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { assertSameOrigin } from '@/lib/security/same-origin'
import { parseAdminProductBody } from '@/lib/admin/product-write'

export async function POST(req: NextRequest) {
  const originCheck = assertSameOrigin(req)
  if (!originCheck.ok) return originCheck.response

  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  try {
    const body = await req.json().catch(() => null)
    const parsed = parseAdminProductBody(body, 'create')
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status })
    }

    const row = parsed.data
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        name: row.name,
        description: row.description,
        price: row.price,
        category: row.category,
        image_url: row.image_url,
        image_urls: row.image_urls ?? [],
        in_stock: row.in_stock,
        brand: row.brand,
        pack_label: row.pack_label,
        unit_amount: row.unit_amount,
        unit_of_measure: row.unit_of_measure,
        stock_quantity: row.stock_quantity,
        variant_group: row.variant_group,
      })
      .select()
      .single()

    if (error) {
      // Older DBs without grocery-ops columns — retry core fields only when
      // the staff did not send extra photos / fabric fields that would be dropped.
      if (/column|does not exist/i.test(error.message)) {
        const wouldDrop =
          (row.image_urls?.length ?? 0) > 0 ||
          Boolean(row.brand) ||
          Boolean(row.pack_label) ||
          row.unit_amount != null ||
          Boolean(row.unit_of_measure) ||
          row.stock_quantity != null ||
          Boolean(row.variant_group)
        if (wouldDrop) {
          return NextResponse.json(
            {
              error:
                'This catalog is missing newer product columns, so extra photos, brand, yardage, and stock were not saved. Run grocery-ops.sql, then try again.',
            },
            { status: 500 }
          )
        }
        const { data: fallback, error: fallbackError } = await supabaseAdmin
          .from('products')
          .insert({
            name: row.name,
            description: row.description,
            price: row.price,
            category: row.category,
            image_url: row.image_url,
            in_stock: row.in_stock,
          })
          .select()
          .single()
        if (fallbackError) {
          return NextResponse.json({ error: fallbackError.message }, { status: 500 })
        }
        return NextResponse.json(fallback, { status: 201 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
