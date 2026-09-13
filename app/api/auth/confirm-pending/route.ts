import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

/**
 * If Supabase still has "Confirm email" on for an old account, confirm it so
 * password sign-in works without another verification email.
 * Password is checked by the subsequent client signInWithPassword call.
 */
export async function POST(request: Request) {
  let email = ''
  try {
    const body = (await request.json()) as { email?: string }
    email = body.email?.trim().toLowerCase() ?? ''
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Enter a valid email.' }, { status: 400 })
  }

  try {
    for (let page = 1; page <= 10; page++) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 })
      if (error) throw error
      const user = data.users.find((u) => u.email?.toLowerCase() === email)
      if (user) {
        if (user.email_confirmed_at) {
          return NextResponse.json({ ok: true, already: true })
        }
        const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
          email_confirm: true,
        })
        if (updateErr) throw updateErr
        return NextResponse.json({ ok: true })
      }
      if (data.users.length < 200) break
    }
    return NextResponse.json({ ok: true, missing: true })
  } catch (e) {
    console.error('[auth/confirm-pending]', e)
    return NextResponse.json({ error: 'Could not continue sign-in.' }, { status: 503 })
  }
}
