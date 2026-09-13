import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ProductForm } from '@/components/admin/ProductForm'
import { requireAdminPage } from '@/lib/auth/require-admin-page'

export default async function NewProductPage() {
  await requireAdminPage()
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/products"
          className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-earth-600 no-underline transition-colors hover:text-earth-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to products
        </Link>
      </div>
      <div>
        <h1 className="admin-page-title">Add product</h1>
        <p className="mt-1 text-sm text-earth-500">
          Fill in the details below. Customers see this immediately.
        </p>
        <p className="mt-2">
          <Link
            href="/admin/products/fabrics/new"
            className="inline-flex min-h-11 items-center text-sm font-medium text-brand-700 no-underline hover:text-brand-800"
          >
            Adding lace or 6-yard prints? Use Add fabric / lace →
          </Link>
        </p>
      </div>
      <ProductForm />
    </div>
  )
}
