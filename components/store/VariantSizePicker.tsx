'use client'

import Link from 'next/link'
import { packLabel, formatUnitPrice, effectiveInStock } from '@/lib/product-pricing'
import { formatMoney } from '@/lib/utils'
import type { Product } from '@/types'

/** Size / pack picker for products sharing the same variant_group. */
export function VariantSizePicker({
  current,
  variants,
}: {
  current: Product
  variants: Product[]
}) {
  if (variants.length < 2) return null

  const sorted = [...variants].sort((a, b) => {
    const aa = Number(a.unit_amount ?? 0)
    const bb = Number(b.unit_amount ?? 0)
    if (aa && bb) return aa - bb
    return a.price - b.price
  })

  return (
    <div className="mt-4">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-earth-500">Size</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {sorted.map((v) => {
          const active = v.id === current.id
          const label = packLabel(v) || formatMoney(v.price)
          const unit = formatUnitPrice(v)
          const available = effectiveInStock(v)
          return (
            <li key={v.id}>
              <Link
                href={`/products/${v.id}`}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex min-h-11 flex-col justify-center rounded-xl border px-3 py-2 no-underline transition duration-150 ${
                  active
                    ? 'border-earth-900 bg-earth-900 text-white'
                    : available
                      ? 'border-earth-200 bg-white text-earth-900 hover:border-earth-400'
                      : 'border-earth-100 bg-earth-50 text-earth-400'
                }`}
              >
                <span className="text-sm font-semibold">{label}</span>
                <span className={`text-[11px] tabular-nums ${active ? 'text-white/80' : 'text-earth-500'}`}>
                  {formatMoney(v.price)}
                  {unit ? ` · ${unit}` : ''}
                  {!available ? ' · out' : ''}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
