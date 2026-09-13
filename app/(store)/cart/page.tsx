'use client'

import Link from 'next/link'
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { Button } from '@/components/ui/button'
import { ProductImage } from '@/components/store/ProductImage'
import { FreeShippingProgress } from '@/components/store/FreeShippingProgress'
import { PickupPromoBanner } from '@/components/store/PickupPromoBanner'
import { OrderByPhone } from '@/components/store/OrderByPhone'
import { formatMoney } from '@/lib/utils'

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, totalItems, clearCart } = useCart()

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] bg-white py-16" suppressHydrationWarning>
        <div className="store-container">
          <div className="mx-auto max-w-md space-y-4">
            <div className="rounded-xl border border-earth-200 bg-white px-6 py-14 text-center shadow-[var(--shadow-card)]">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-earth-100">
                <ShoppingBag className="h-7 w-7 text-earth-400" strokeWidth={1.5} />
              </div>
              <h1 className="mt-5 text-xl font-semibold text-earth-900">Your cart is empty</h1>
              <p className="mt-1 text-sm text-earth-600">
                Add products to get started — or place the order by phone.
              </p>
              <Link href="/shop" className="mt-6 inline-block no-underline">
                <Button size="lg" className="h-11 px-6">
                  Start shopping
                </Button>
              </Link>
            </div>
            <OrderByPhone />
          </div>
        </div>
      </div>
    )
  }

  const itemHint = items
    .slice(0, 8)
    .map(({ product, quantity }) => `- ${product.name} x${quantity}`)
    .join('\n')

  return (
    <div className="min-h-screen bg-white md:pb-12" suppressHydrationWarning>
      <div className="border-b border-earth-200 bg-white">
        <div className="store-container py-6 sm:py-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-earth-500">Your order</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-earth-900 sm:text-3xl">
            Cart <span className="text-earth-400 font-normal">({totalItems})</span>
          </h1>
        </div>
      </div>

      <div className="store-container py-6 sm:py-8">
        <PickupPromoBanner className="mb-6" compact />

        <div className="grid gap-8 md:grid-cols-3 md:gap-8 lg:gap-10">
          <div className="space-y-3 lg:col-span-2">
            {items.map(({ product, quantity }) => (
              <article
                key={product.id}
                className="flex gap-4 rounded-xl border border-earth-200 bg-white p-4 transition-shadow duration-150 hover:shadow-[var(--shadow-card)]"
              >
                <Link href={`/products/${product.id}`} className="shrink-0 no-underline">
                  <ProductImage
                    src={product.image_url}
                    alt={product.name}
                    className="h-20 w-20 rounded-md sm:h-24 sm:w-24"
                    sizes="96px"
                    framed={false}
                  />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-earth-500">
                    {product.category}
                  </p>
                  <Link
                    href={`/products/${product.id}`}
                    className="mt-0.5 text-sm font-medium text-earth-900 no-underline hover:text-brand-700 sm:text-base"
                  >
                    {product.name}
                  </Link>
                  <p className="mt-1 text-sm font-semibold text-earth-900 tabular-nums">
                    {formatMoney(product.price)}
                  </p>

                  <div className="mt-auto flex flex-wrap items-center gap-3 pt-3">
                    <div className="inline-flex items-center rounded-md border border-earth-200">
                      <button
                        type="button"
                        className="flex h-11 w-11 items-center justify-center text-earth-700 transition-colors hover:bg-earth-50 disabled:opacity-40"
                        aria-label="Decrease quantity"
                        disabled={quantity <= 1}
                        onClick={() => updateQuantity(product.id, Math.max(1, quantity - 1))}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        className="flex h-11 w-11 items-center justify-center text-earth-700 transition-colors hover:bg-earth-50"
                        aria-label="Increase quantity"
                        onClick={() => updateQuantity(product.id, Math.min(99, quantity + 1))}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-earth-900 tabular-nums">
                      {formatMoney(product.price * quantity)}
                    </span>
                    <button
                      type="button"
                      className="ml-auto inline-flex min-h-11 items-center gap-1 px-2 text-xs font-medium text-earth-500 transition-colors hover:text-red-600"
                      onClick={() => removeItem(product.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}

            <OrderByPhone className="md:hidden" itemHint={itemHint} />
          </div>

          <div>
            <div className="sticky top-24 space-y-4">
              <div className="rounded-xl border border-earth-200 bg-white p-5 shadow-[var(--shadow-card)]">
                <h2 className="text-base font-semibold text-earth-900">Order summary</h2>

                <div className="mt-4">
                  <FreeShippingProgress subtotal={totalPrice} />
                </div>

                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-earth-600">
                      Subtotal <span className="text-earth-400">({totalItems})</span>
                    </dt>
                    <dd className="font-semibold text-earth-900 tabular-nums">
                      {formatMoney(totalPrice)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-earth-600">Shipping</dt>
                    <dd className="text-earth-500">Calculated at checkout</dd>
                  </div>
                </dl>

                <div className="mt-4 flex items-baseline justify-between border-t border-earth-100 pt-4">
                  <span className="text-sm font-semibold text-earth-900">Total</span>
                  <span className="text-2xl font-semibold tracking-tight text-earth-900 tabular-nums">
                    {formatMoney(totalPrice)}
                  </span>
                </div>

                <Link href="/checkout" className="mt-5 block no-underline">
                  <Button size="lg" className="h-11 w-full gap-2">
                    Checkout
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <div className="mt-3 flex flex-col gap-1.5 text-center text-xs">
                  <Link
                    href="/shop"
                    className="font-medium text-brand-700 no-underline hover:text-brand-800"
                  >
                    Continue shopping
                  </Link>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-earth-500 transition-colors hover:text-earth-900"
                  >
                    Clear cart
                  </button>
                </div>
              </div>

              <OrderByPhone compact className="hidden md:block" itemHint={itemHint} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
