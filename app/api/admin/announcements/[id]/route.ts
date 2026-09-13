import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/require-admin-api'
import { assertSameOrigin } from '@/lib/security/same-origin'
import { supabaseAdmin } from '@/lib/supabase-admin'

const MESSAGE_MAX = 280
const HREF_MAX = 500

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
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
    }

    const update: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (Object.prototype.hasOwnProperty.call(body, 'message')) {
      const message = typeof body.message === 'string' ? body.message.trim() : ''
      if (!message || message.length > MESSAGE_MAX) {
        return NextResponse.json(
          { error: `Message is required (max ${MESSAGE_MAX} chars).` },
          { status: 400 }
        )
      }
      update.message = message
    }

    if (Object.prototype.hasOwnProperty.call(body, 'href')) {
      if (body.href === null || body.href === '') {
        update.href = null
      } else if (typeof body.href === 'string') {
        const href = body.href.trim()
        if (href.length > HREF_MAX) {
          return NextResponse.json({ error: 'href is too long.' }, { status: 400 })
        }
        update.href = href || null
      } else {
        return NextResponse.json({ error: 'href must be a string or null.' }, { status: 400 })
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, 'sort_order')) {
      const n = Number(body.sort_order)
      if (!Number.isFinite(n)) {
        return NextResponse.json({ error: 'sort_order must be a number.' }, { status: 400 })
      }
      update.sort_order = Math.trunc(n)
    }

    if (Object.prototype.hasOwnProperty.call(body, 'active')) {
      update.active = Boolean(body.active)
    }

    const { data, error } = await supabaseAdmin
      .from('site_announcements')
      .update(update)
      .eq('id', id)
      .select('id, message, href, sort_order, active, created_at, updated_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const originCheck = assertSameOrigin(req)
  if (!originCheck.ok) return originCheck.response

  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { id } = await params
  const { error } = await supabaseAdmin.from('site_announcements').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
