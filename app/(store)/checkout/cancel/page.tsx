import Link from 'next/link'
import { PageHeader } from '@/components/store/PageHeader'
import { Button } from '@/components/ui/button'

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-cream">
      <PageHeader
        eyebrow="Checkout"
        title="Payment canceled"
        subtitle="No payment was taken. Your cart is unchanged."
        centered
      />
      <div className="store-container flex flex-col items-center gap-4 py-12 sm:flex-row sm:justify-center">
        <Link href="/checkout" className="no-underline">
          <Button size="lg" className="rounded-xl">
            Back to checkout
          </Button>
        </Link>
        <Link href="/cart" className="no-underline">
          <Button variant="outline" size="lg" className="rounded-xl">
            View cart
          </Button>
        </Link>
      </div>
    </div>
  )
}
