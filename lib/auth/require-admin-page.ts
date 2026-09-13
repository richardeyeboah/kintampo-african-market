import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClientOptional } from '@/lib/supabase/server'
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/auth/admin-session'
import { isSupabaseAdminRoleBypassEnabled } from '@/lib/auth/admin-access-mode'

/**
 * Server-component admin gate for `/admin/**` pages — defense in depth on top of
 * `proxy.ts`. Unauthenticated visitors never render dashboard markup.
 *
 * Default: valid signed `admin_session` cookie only (from `/api/admin/login`).
 * Optional: `ADMIN_ALLOW_SUPABASE_ROLE=1` also allows Supabase users with `profiles.role === 'admin'`.
 */
export async function requireAdminPage(): Promise<void> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value
  if (await verifyAdminSessionToken(sessionToken)) return

  if (!isSupabaseAdminRoleBypassEnabled()) {
    redirect('/admin/login')
  }

  const supabase = await createClientOptional()
  if (!supabase) {
    redirect('/admin/login?error=configuration')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/admin/login')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (error || profile?.role !== 'admin') {
    redirect('/admin/login?error=forbidden')
  }
}
