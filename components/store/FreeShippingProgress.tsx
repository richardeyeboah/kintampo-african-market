import {
  FREE_STANDARD_SHIPPING_SUBTOTAL,
  freeStandardShippingProgress,
  freeStandardShippingRemaining,
} from '@/lib/shipping'
import { formatMoney } from '@/lib/utils'

type Props = {
  subtotal: number
}

export function FreeShippingProgress({ subtotal }: Props) {
  const remaining = freeStandardShippingRemaining(subtotal)
  const progress = freeStandardShippingProgress(subtotal)
  const unlocked = remaining <= 0

  return (
    <div className="rounded-md bg-earth-50 p-3">
      {unlocked ? (
        <p className="text-xs font-semibold text-brand-700">
          Free standard US shipping at checkout
        </p>
      ) : (
        <p className="text-xs text-earth-700">
          Add{' '}
          <span className="font-semibold text-earth-900 tabular-nums">
            {formatMoney(remaining)}
          </span>{' '}
          for free standard US shipping (orders ${FREE_STANDARD_SHIPPING_SUBTOTAL}+)
        </p>
      )}
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-earth-200">
        <div
          className="h-full rounded-full bg-brand-600 transition-[width] duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
