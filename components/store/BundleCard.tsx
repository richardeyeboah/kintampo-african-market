'use client'

import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/button'
import { ProductImage } from '@/components/store/ProductImage'
import { formatMoney } from '@/lib/utils'
import type { ProductBundle } from '@/lib/supabase/bundles'

/** Dense, price-forward kit card — Sam's Club multipack energy. */
export function BundleCard({
  bundle,
  quiet = false,
}: {
  bundle: ProductBundle
  /** Quieter chrome for home (bestsellers stay louder). */
  quiet?: boolean
}) {
  const { addItem } = useCart()
  const toast = useToast()

  const listTotal = bundle.items.reduce((s, i) => s + i.product.price * i.quantity, 0)
  const discount = Math.max(0, Math.min(50, Number(bundle.discount_percent) || 0))
  const saleTotal = Math.round(listTotal * (1 - discount / 100) * 100) / 100
  const thumbs = bundle.items.slice(0, 4)
  const extra = Math.max(0, bundle.items.length - thumbs.length)

  function addAll() {
    for (const line of bundle.items) {
      if (!line.product.in_stock) continue
      addItem(line.product, line.quantity)
    }
    toast?.show(`Added kit: ${bundle.name}`)
  }

  return (
    <article
      className={
        quiet
          ? 'flex h-full flex-col border-b border-earth-200 bg-transparent pb-5'
          : 'premium-card flex h-full flex-col overflow-hidden'
      }
    >
      <Link href={`/bundles/${bundle.slug}`} className="flex flex-1 flex-col no-underline">
        <div
          className={`grid grid-cols-4 gap-px ${
            quiet ? 'rounded-xl border border-earth-200 bg-earth-100' : 'bg-earth-100'
          }`}
        >
          {thumbs.map((line) => (
            <div key={line.product.id} className="relative aspect-square bg-white">
              <ProductImage
                src={line.product.image_url}
                alt={line.product.name}
                className="h-full w-full rounded-none"
                sizes="80px"
                framed={false}
              />
              {line.quantity > 1 && (
                <span className="absolute bottom-1 right-1 rounded bg-earth-900/85 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white">
                  ×{line.quantity}
                </span>
              )}
            </div>
          ))}
          {Array.from({ length: Math.max(0, 4 - thumbs.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square bg-earth-50" aria-hidden />
          ))}
        </div>

        <div className={quiet ? 'mt-3' : 'p-4 sm:p-5'}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold leading-snug text-earth-900">
                {bundle.name}
              </h3>
              <p className="mt-1 text-xs text-earth-500">
                {bundle.items.length} item{bundle.items.length === 1 ? '' : 's'}
                {extra > 0 ? ` · +${extra} more` : ''}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-lg font-semibold tabular-nums tracking-tight text-earth-900">
                {formatMoney(saleTotal)}
              </p>
              {discount > 0 && (
                <p className="text-[11px] font-medium tabular-nums text-earth-400 line-through">
                  {formatMoney(listTotal)}
                </p>
              )}
            </div>
          </div>
          {discount > 0 && (
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-accent-800">
              {discount}% kit price
            </p>
          )}
        </div>
      </Link>

      <div className={quiet ? 'mt-3' : 'px-4 pb-4 sm:px-5 sm:pb-5'}>
        <Button
          type="button"
          variant={quiet ? 'outline' : 'default'}
          className="h-11 w-full"
          onClick={addAll}
        >
          Add kit to cart
        </Button>
      </div>
    </article>
  )
}
