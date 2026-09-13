import { requireAdminPage } from '@/lib/auth/require-admin-page'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ReviewApprovalList, type AdminReview } from '@/components/admin/ReviewApprovalList'

export default async function AdminReviewsPage() {
  await requireAdminPage()

  const { data: pending } = await supabaseAdmin
    .from('product_reviews')
    .select('id, product_id, reviewer_name, rating, comment, created_at, products(name)')
    .eq('approved', false)
    .order('created_at', { ascending: true })

  const { data: approved } = await supabaseAdmin
    .from('product_reviews')
    .select('id, product_id, reviewer_name, rating, comment, created_at, products(name)')
    .eq('approved', true)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="admin-page-title">Product reviews</h1>
        <p className="mt-1 text-sm text-earth-500">
          Approve customer reviews before they appear on the store.
        </p>
      </div>
      <ReviewApprovalList
        pending={(pending ?? []) as AdminReview[]}
        approved={(approved ?? []) as AdminReview[]}
      />
    </div>
  )
}
