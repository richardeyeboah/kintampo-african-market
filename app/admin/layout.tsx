import type { ReactNode } from 'react'
import { Suspense } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminOrderNotifier } from '@/components/admin/AdminOrderNotifier'
import { AdminShellContent } from '@/components/admin/AdminShellContent'

export const metadata = { title: 'Admin' }
export const dynamic = 'force-dynamic'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-shell">
      <Suspense fallback={null}>
        <AdminSidebar />
      </Suspense>
      <AdminOrderNotifier />
      <AdminShellContent>{children}</AdminShellContent>
    </div>
  )
}
