import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendTransactionalEmail } from '@/lib/email/send-order-emails'
import { CANONICAL_SITE_URL, getPublicSiteUrl } from '@/lib/site-url'

function emailSiteOrigin(): string {
  const origin = getPublicSiteUrl()
  // Never put localhost links in customer emails (local .env often overrides SITE_URL).
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
    return CANONICAL_SITE_URL
  }
  return origin
}

export const runtime = 'nodejs'

type Body = {
  email?: string
  next?: string
}

/**
 * Password reset emails via our Gmail/SMTP transport (order alerts path).
 * Supabase Auth SMTP currently returns unexpected_failure on send; generateLink
 * still works, so we build the safe /auth/confirm URL and deliver it ourselves.
 */
export async function POST(request: Request) {
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase() ?? ''
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Enter a valid email.' }, { status: 400 })
  }

  const nextRaw = typeof body.next === 'string' ? body.next : '/account'
  const nextPath = nextRaw.startsWith('/') ? nextRaw : '/account'

  // Always return the same success shape (no account enumeration).
  const ok = NextResponse.json({ ok: true })

  try {
    const origin = emailSiteOrigin()
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(nextPath)}`,
      },
    })

    if (error) {
      // User missing or other Auth error — still look like success to the client.
      console.warn('[forgot-password] generateLink:', error.message)
      return ok
    }

    const tokenHash = data.properties?.hashed_token
    if (!tokenHash) {
      console.error('[forgot-password] generateLink missing hashed_token')
      return ok
    }

    const confirmUrl = new URL(`${origin}/auth/confirm`)
    confirmUrl.searchParams.set('token_hash', tokenHash)
    confirmUrl.searchParams.set('type', 'recovery')
    confirmUrl.searchParams.set('next', nextPath)

    const link = confirmUrl.toString()
    const sent = await sendTransactionalEmail({
      to: email,
      subject: 'Reset your password — Kintampo African Market',
      text: [
        'Reset your password for Kintampo African Market.',
        '',
        `Open this link (expires soon): ${link}`,
        '',
        'If you did not request this, ignore this email.',
      ].join('\n'),
      html: `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#1c1917;max-width:480px;margin:0 auto;padding:24px;">
  <p style="margin:0 0 16px;font-size:16px;font-weight:600;">Reset your password</p>
  <p style="margin:0 0 20px;font-size:14px;color:#57534e;">Kintampo African Market — tap below, then choose a new password.</p>
  <p style="margin:0 0 24px;">
    <a href="${link}" style="display:inline-block;background:#CE1126;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:10px;">Continue</a>
  </p>
  <p style="margin:0;font-size:12px;color:#78716c;">Link expires soon. If you did not request this, ignore this email.</p>
</body></html>`,
    })

    if (!sent) {
      console.error('[forgot-password] email transport failed for', email)
      return NextResponse.json(
        { error: 'Could not send email. Try again in a few minutes.' },
        { status: 503 }
      )
    }
  } catch (err) {
    console.error('[forgot-password] unexpected:', err)
    return NextResponse.json(
      { error: 'Could not send email. Try again in a few minutes.' },
      { status: 503 }
    )
  }

  return ok
}
