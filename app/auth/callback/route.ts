import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type EmailOtpType = 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email'

/**
 * OAuth (Google) still exchanges here immediately.
 * Email recovery / confirm links with token_hash are sent to /auth/confirm so a
 * human click is required — email security scanners otherwise burn one-time links.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const typeRaw = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'
  const safeNext = next.startsWith('/') ? next : '/'

  // Email OTP / recovery: never auto-consume on GET (prefetchers).
  if (tokenHash && typeRaw) {
    const confirm = new URL('/auth/confirm', origin)
    confirm.searchParams.set('token_hash', tokenHash)
    confirm.searchParams.set('type', typeRaw)
    confirm.searchParams.set('next', safeNext)
    return NextResponse.redirect(confirm)
  }

  // PKCE email links sometimes arrive with only `code` (no OAuth session intent).
  // Send those to the confirm button page too when `type` is present.
  if (code && typeRaw) {
    const confirm = new URL('/auth/confirm', origin)
    confirm.searchParams.set('code', code)
    confirm.searchParams.set('type', typeRaw)
    confirm.searchParams.set('next', safeNext)
    return NextResponse.redirect(confirm)
  }

  const supabase = await createClient()

  // OAuth / same-browser PKCE without email type — exchange immediately.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`)
    }
    console.warn('[auth/callback] exchangeCodeForSession failed:', error.message)
  }

  // Legacy token_hash path if somehow not redirected above
  if (tokenHash && typeRaw) {
    const type = typeRaw as EmailOtpType
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`)
    }
    console.warn('[auth/callback] verifyOtp failed:', error.message)
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
