import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/require-admin-api'
import { assertSameOrigin } from '@/lib/security/same-origin'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const originCheck = assertSameOrigin(req)
  if (!originCheck.ok) return originCheck.response

  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  try {
    const { id } = await params
    const body = await req.json()

    const update: Record<string, string> = {}
    if (typeof body.full_name === 'string') update.full_name = body.full_name.trim().slice(0, 100)
    if (typeof body.phone === 'string') update.phone = body.phone.trim().slice(0, 30)

    if (!Object.keys(update).length) {
      return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update(update)
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
