import { NextRequest, NextResponse } from 'next/server'
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_TTL_SECONDS,
  createAdminSessionToken,
} from '@/lib/auth/admin-session'

export const runtime = 'nodejs'

/**
 * Dev-only emergency admin sign-in.
 *
 * Only works when NODE_ENV !== 'production'. Lets you skip the staff-password
 * check while you're locked out by the rate limiter or fighting with autofill,
 * so you can keep working on the admin UI without redeploying.
 *
 * On Vercel / production this returns 404 — bypass is impossible.
 */
function devGate(): NextResponse | null {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }
  return null
}

async function issue(): Promise<NextResponse> {
  const { token } = await createAdminSessionToken()
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: ADMIN_SESSION_TTL_SECONDS,
    path: '/',
  })
  return res
}

export async function POST() {
  const blocked = devGate()
  if (blocked) return blocked
  return issue()
}

/**
 * GET also works so you can paste this into the browser address bar:
 *   http://localhost:3000/api/admin/dev-login
 * and then visit /admin directly.
 */
export async function GET(req: NextRequest) {
  const blocked = devGate()
  if (blocked) return blocked

  await issue()
  // Re-issue and attach cookie to a redirect so the browser navigates to /admin.
  const { token } = await createAdminSessionToken()
  const url = new URL('/admin', req.url)
  const res = NextResponse.redirect(url)
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: ADMIN_SESSION_TTL_SECONDS,
    path: '/',
  })
  return res
}
