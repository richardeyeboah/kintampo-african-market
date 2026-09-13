import { requireAdminPage } from '@/lib/auth/require-admin-page'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  AnnouncementsAdmin,
  type AdminAnnouncement,
} from '@/components/admin/AnnouncementsAdmin'

export default async function AdminAnnouncementsPage() {
  await requireAdminPage()

  const { data } = await supabaseAdmin
    .from('site_announcements')
    .select('id, message, href, sort_order, active, created_at, updated_at')
    .order('sort_order', { ascending: true })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="admin-page-title">Announcements</h1>
        <p className="mt-1 text-sm text-earth-500">
          Messages shown in the storefront announcement bar.
        </p>
      </div>
      <AnnouncementsAdmin initial={(data ?? []) as AdminAnnouncement[]} />
    </div>
  )
}
