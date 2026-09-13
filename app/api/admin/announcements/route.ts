import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/require-admin-api'
import { assertSameOrigin } from '@/lib/security/same-origin'
import { supabaseAdmin } from '@/lib/supabase-admin'

const MESSAGE_MAX = 280
const HREF_MAX = 500

export async function GET() {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { data, error } = await supabaseAdmin
    .from('site_announcements')
    .select('id, message, href, sort_order, active, created_at, updated_at')
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const originCheck = assertSameOrigin(req)
  if (!originCheck.ok) return originCheck.response

  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
    }

    const message = typeof body.message === 'string' ? body.message.trim() : ''
    const hrefRaw = typeof body.href === 'string' ? body.href.trim() : ''
    const href = hrefRaw || null
    const sortOrder = Number.isFinite(Number(body.sort_order))
      ? Math.trunc(Number(body.sort_order))
      : 0
    const active = body.active === undefined ? true : Boolean(body.active)

    if (!message || message.length > MESSAGE_MAX) {
      return NextResponse.json(
        { error: `Message is required (max ${MESSAGE_MAX} chars).` },
        { status: 400 }
      )
    }
    if (href && href.length > HREF_MAX) {
      return NextResponse.json({ error: 'href is too long.' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('site_announcements')
      .insert({
        message,
        href,
        sort_order: sortOrder,
        active,
        updated_at: new Date().toISOString(),
      })
      .select('id, message, href, sort_order, active, created_at, updated_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
