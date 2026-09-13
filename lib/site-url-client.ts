/**
 * Public site origin for Supabase auth redirects (reset password, magic link, OAuth, email verification).
 *
 * Prefer `NEXT_PUBLIC_SITE_URL` in production (Vercel) so links inside emails always target your
 * real domain — not localhost from an old dev session or a mismatched preview URL.
 */
export function getAuthSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (raw) {
    try {
      const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
      return new URL(withProtocol).origin
    } catch {
      /* ignore invalid env */
    }
  }
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return ''
}
