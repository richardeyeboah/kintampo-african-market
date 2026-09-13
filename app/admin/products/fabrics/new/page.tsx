import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { FabricProductForm } from '@/components/admin/FabricProductForm'
import { requireAdminPage } from '@/lib/auth/require-admin-page'

export default async function NewFabricProductPage() {
  await requireAdminPage()
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link
          href="/admin/products"
          className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-earth-600 no-underline transition-colors hover:text-earth-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to products
        </Link>
        <h1 className="admin-page-title mt-3">Add fabric / lace</h1>
        <p className="mt-1 max-w-2xl text-sm text-earth-500">
          Built for African prints, lace, headtie, kente, brocade, and george — brand/line,
          piece price, yardage, width, and stock. Grocery add product stays separate.
        </p>
        <p className="mt-2">
          <Link
            href="/admin/products/new"
            className="inline-flex min-h-11 items-center text-sm font-medium text-brand-700 no-underline hover:text-brand-800"
          >
            Need groceries instead? Use standard Add product →
          </Link>
        </p>
      </div>
      <FabricProductForm />
    </div>
  )
}
