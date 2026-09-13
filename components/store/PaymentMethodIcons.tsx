import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
}

/** Subtle trust line — no card-brand sticker row (Stripe Payment Element shows methods at checkout). */
export function PaymentMethodIcons({ className }: Props) {
  return (
    <p
      className={cn(
        'flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs text-earth-500 sm:justify-start',
        className
      )}
    >
      <Lock className="h-3.5 w-3.5 shrink-0 text-earth-400" aria-hidden />
      <span>
        Visa, Mastercard, Amex, Discover, Apple Pay, and Google Pay — secured by Stripe
      </span>
    </p>
  )
}
