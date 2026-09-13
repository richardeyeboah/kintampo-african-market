/**
 * Admin surface access policy (password-first).
 *
 * By default every `/admin` page and `/api/admin/*` route requires a valid
 * signed `admin_session` cookie from POST `/api/admin/login` with `ADMIN_PASSWORD`.
 *
 * Set `ADMIN_ALLOW_SUPABASE_ROLE=1` only if you intentionally want Supabase
 * users whose `profiles.role === 'admin'` to bypass the password cookie.
 */
export function isSupabaseAdminRoleBypassEnabled(): boolean {
  return process.env.ADMIN_ALLOW_SUPABASE_ROLE?.trim() === '1'
}
