import Link from 'next/link'
import { FileText } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function PrintAddressSlipLink({
  orderId,
  isPickup,
  isLocalDelivery,
}: {
  orderId: string
  isPickup: boolean
  isLocalDelivery?: boolean
}) {
  if (isPickup || isLocalDelivery) return null

  return (
    <div className="rounded-lg border border-earth-200 bg-earth-50 p-4">
      <p className="text-sm font-semibold text-earth-900">Counter shipping</p>
      <p className="mt-1 text-sm text-earth-600">Print an address slip and pay postage at USPS or UPS.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/admin/orders/${orderId}/print-slip`}
          className={cn(buttonVariants({ variant: 'default', size: 'default' }))}
        >
          <FileText className="h-4 w-4" aria-hidden />
          Address slip
        </Link>
      </div>
    </div>
  )
}
