'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowRight, Check, ShoppingBag } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { createClient, isSupabaseBrowserConfigured } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/lib/utils'
import type { Product } from '@/types'

type OrderItem = {
  product_id: string | null
  product_name: string
  product_price: number
  quantity: number
}

export function ReorderClient({ items }: { items: OrderItem[] }) {
  const { addItem } = useCart()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [missing, setMissing] = useState<string[]>([])

  async function reorder() {
    setBusy(true)
    const missedItems: string[] = []

    if (!isSupabaseBrowserConfigured()) {
      setBusy(false)
      return
    }

    const supabase = createClient()

    for (const item of items) {
      if (!item.product_id) {
        missedItems.push(item.product_name)
        continue
      }
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('id', item.product_id)
        .eq('in_stock', true)
        .maybeSingle()

      if (!data) {
        missedItems.push(item.product_name)
        continue
      }
      addItem(data as Product, item.quantity)
    }

    setMissing(missedItems)
    setDone(true)
    setBusy(false)
  }

  const addedCount = items.length - missing.length

  return (
    <div className="space-y-6">
      {/* Item list */}
      <div className="premium-card overflow-hidden p-0">
        <div className="border-b border-earth-100 px-5 py-4">
          <p className="text-sm font-semibold text-earth-900">Items in this order</p>
        </div>
        <ul className="divide-y divide-earth-100">
          {items.map((it, i) => (
            <li key={i} className="flex items-center justify-between gap-4 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-earth-900">{it.product_name}</p>
                <p className="text-xs text-earth-500">Qty: {it.quantity}</p>
              </div>
              <p className="text-sm font-semibold text-earth-900 tabular-nums">
                {formatMoney(it.product_price * it.quantity)}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* Success state */}
      {done && (
        <div className={`rounded-xl border p-4 ${addedCount > 0 ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
          {addedCount > 0 && (
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
              <Check className="h-4 w-4" />
              {addedCount} item{addedCount === 1 ? '' : 's'} added to your cart
            </p>
          )}
          {missing.length > 0 && (
            <p className="mt-1 text-xs text-amber-800">
              No longer available: {missing.join(', ')}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {!done ? (
          <Button
            type="button"
            size="lg"
            className="gap-2"
            onClick={() => void reorder()}
            disabled={busy}
          >
            <ShoppingBag className="h-4 w-4" />
            {busy ? 'Adding to cart…' : 'Add all to cart'}
          </Button>
        ) : (
          <Button
            type="button"
            size="lg"
            className="gap-2"
            onClick={() => router.push('/cart')}
          >
            Go to cart
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
        <Link href="/shop" className="no-underline">
          <Button variant="outline" size="lg">Continue shopping</Button>
        </Link>
      </div>
    </div>
  )
}
