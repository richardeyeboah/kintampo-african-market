import { AdminLoginClient } from '@/components/admin/AdminLoginClient'
import { isSupabaseAdminRoleBypassEnabled } from '@/lib/auth/admin-access-mode'

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const sp = await searchParams
  return (
    <AdminLoginClient
      allowSupabaseAdmin={isSupabaseAdminRoleBypassEnabled()}
      forbidden={sp.error === 'forbidden'}
      devMode={process.env.NODE_ENV !== 'production'}
      adminPasswordConfigured={Boolean(process.env.ADMIN_PASSWORD?.trim())}
      adminSecretConfigured={Boolean(process.env.ADMIN_SESSION_SECRET?.trim())}
    />
  )
}
