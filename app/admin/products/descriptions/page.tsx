import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdminPage } from '@/lib/auth/require-admin-page'
import { BulkDescriptionEditor } from '@/components/admin/BulkDescriptionEditor'

export default async function ProductDescriptionsPage() {
  await requireAdminPage()

  const { data: products } = await supabaseAdmin
    .from('products')
    .select('id, name, category, description')
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  const all = products ?? []
  const missingCount = all.filter((p) => !p.description?.trim()).length

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/products"
          className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-earth-600 no-underline hover:text-earth-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to products
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="admin-page-title flex items-center gap-2">
            <FileText className="h-6 w-6 text-brand-700" aria-hidden />
            Product descriptions
          </h1>
          <p className="mt-1 text-sm text-earth-500">
            Descriptions help customers decide what to buy and improve Google search rankings.
            {missingCount > 0 && (
              <span className="ml-1 font-semibold text-amber-700">{missingCount} products still need one.</span>
            )}
          </p>
        </div>
      </div>

      {all.length === 0 ? (
        <div className="admin-card text-center text-sm text-earth-500">No products yet.</div>
      ) : (
        <BulkDescriptionEditor products={all} />
      )}
    </div>
  )
}
