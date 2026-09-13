import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireAdminPage } from '@/lib/auth/require-admin-page'
import { PhoneOrderForm } from '@/components/admin/PhoneOrderForm'

export default async function AdminNewPhoneOrderPage() {
  await requireAdminPage()

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/orders?queue=needs_action"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-earth-600 no-underline hover:text-earth-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to orders
        </Link>
        <h1 className="admin-page-title mt-3">Phone order</h1>
        <p className="mt-1 max-w-2xl text-sm text-earth-500">
          Take the order while they&apos;re on the line. Save unpaid if they&apos;ll pay later, or
          mark paid if cash / Zelle / card already landed. Then fulfill like any other order.
        </p>
      </div>

      <PhoneOrderForm />
    </div>
  )
}
