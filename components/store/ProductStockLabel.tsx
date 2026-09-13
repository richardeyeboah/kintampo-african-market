import { cn } from '@/lib/utils'
import { effectiveInStock, lowStockCount } from '@/lib/product-pricing'

type Props = {
  inStock: boolean
  stockQuantity?: number | null
  className?: string
  /** Shorter copy for product cards */
  compact?: boolean
}

export function ProductStockLabel({
  inStock,
  stockQuantity,
  className,
  compact,
}: Props) {
  const available = effectiveInStock({ in_stock: inStock, stock_quantity: stockQuantity })
  const low = lowStockCount({ in_stock: inStock, stock_quantity: stockQuantity })

  if (!available) {
    return (
      <span
        className={cn(
          'inline-flex items-center text-[11px] font-semibold uppercase tracking-wider text-earth-500',
          className
        )}
      >
        Out of stock
      </span>
    )
  }

  if (low != null) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800',
          className
        )}
      >
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
        {compact ? `Only ${low} left` : `Only ${low} left · order soon`}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium text-brand-700',
        className
      )}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" aria-hidden />
      {compact ? 'In stock' : 'In stock · ships in 24h'}
    </span>
  )
}
