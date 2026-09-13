'use client'

import Link from 'next/link'
import { Check, Plus, ShoppingBag } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { ProductImage } from '@/components/store/ProductImage'
import { Button } from '@/components/ui/button'
import { cn, formatMoney } from '@/lib/utils'
import type { Product } from '@/types'

type Props = {
  anchor: Product
  suggestions: Product[]
}

export function FrequentlyBoughtTogether({ anchor, suggestions }: Props) {
  const { addItem } = useCart()
  const toast = useToast()

  const initialSelected = useMemo(
    () => new Set<string>([anchor.id, ...suggestions.slice(0, 2).map((p) => p.id)]),
    [anchor.id, suggestions]
  )
  const [selected, setSelected] = useState<Set<string>>(initialSelected)
  const [added, setAdded] = useState(false)

  const allProducts = useMemo(() => [anchor, ...suggestions], [anchor, suggestions])
  const selectedProducts = allProducts.filter((p) => selected.has(p.id))
  const total = selectedProducts.reduce((sum, p) => sum + p.price, 0)
  const selectedCount = selectedProducts.length

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function addAll() {
    selectedProducts.forEach((p) => {
      if (p.in_stock) addItem(p, 1)
    })
    toast?.show(`Added ${selectedCount} item${selectedCount === 1 ? '' : 's'} to cart`)
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  if (suggestions.length === 0) return null

  return (
    <section className="border-t border-earth-200 bg-earth-50 py-10 sm:py-12">
      <div className="store-container">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-earth-900 sm:text-2xl">
              Frequently bought together
            </h2>
            <p className="mt-1 text-sm text-earth-600">
              Customers often add these in the same order.
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-earth-200 bg-white">
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] items-stretch gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
            <ul className="grid min-w-0 grid-cols-2 gap-2 px-3 py-5 sm:flex sm:items-center sm:gap-1 sm:overflow-x-auto sm:px-5">
              {allProducts.map((p, i) => (
                <li key={p.id} className="flex min-w-0 items-center sm:shrink-0">
                  <label
                    className={cn(
                      'group flex w-full cursor-pointer flex-col items-center gap-2 rounded-lg border p-2 transition-colors sm:w-36',
                      selected.has(p.id)
                        ? 'border-brand-500 bg-brand-50/50'
                        : 'border-earth-200 bg-white hover:border-earth-300'
                    )}
                  >
                    <span className="relative">
                      <ProductImage
                        src={p.image_url}
                        alt={p.name}
                        className="h-20 w-20 rounded-md"
                        sizes="80px"
                        framed={false}
                      />
                      <span
                        className={cn(
                          'absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white shadow-sm transition-colors',
                          selected.has(p.id) ? 'bg-brand-700' : 'bg-white'
                        )}
                      >
                        {selected.has(p.id) ? (
                          <Check className="h-3 w-3 text-white" strokeWidth={3} />
                        ) : (
                          <span className="h-3 w-3 rounded-full border border-earth-300" />
                        )}
                      </span>
                    </span>
                    <Link
                      href={`/products/${p.id}`}
                      className="line-clamp-2 flex min-h-11 items-center px-1 text-center text-[12px] font-medium text-earth-900 no-underline hover:text-brand-700"
                    >
                      {p.name}
                    </Link>
                    <p className="text-[13px] font-semibold tabular-nums text-earth-900">
                      {formatMoney(p.price)}
                    </p>
                    {i === 0 && (
                      <span className="rounded-full bg-earth-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-earth-700">
                        This item
                      </span>
                    )}
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selected.has(p.id)}
                      onChange={() => toggle(p.id)}
                      disabled={i === 0}
                    />
                  </label>
                  {i < allProducts.length - 1 && (
                    <Plus className="mx-1 hidden h-4 w-4 shrink-0 text-earth-400 sm:block" aria-hidden />
                  )}
                </li>
              ))}
            </ul>

            <div className="flex flex-col justify-between border-t border-earth-200 bg-earth-50 p-5 lg:border-l lg:border-t-0">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-earth-500">
                  Bundle total
                </p>
                <p className="mt-1 text-3xl font-semibold tracking-tight text-earth-900 tabular-nums">
                  {formatMoney(total)}
                </p>
                <p className="mt-0.5 text-xs text-earth-500">
                  {selectedCount} item{selectedCount === 1 ? '' : 's'} selected
                </p>
              </div>
              <Button
                type="button"
                size="lg"
                className="mt-4 h-11 w-full gap-2"
                onClick={addAll}
                disabled={selectedCount === 0}
              >
                {added ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden />
                    Added {selectedCount} item{selectedCount === 1 ? '' : 's'}
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" aria-hidden />
                    Add {selectedCount} to cart
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
