'use client'

import Link from 'next/link'
import { Minus, Plus, ShoppingBag, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useCart } from '@/context/CartContext'
import { ProductImage } from '@/components/store/ProductImage'
import { Button } from '@/components/ui/button'
import { FreeShippingProgress } from '@/components/store/FreeShippingProgress'
import { formatMoney } from '@/lib/utils'

export function CartDrawer() {
  const {
    items,
    cartOpen,
    closeCart,
    removeItem,
    updateQuantity,
    totalItems,
    totalPrice,
  } = useCart()

  const drawerRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // ---------------------------------------------------------------------------
  // Scroll lock — iOS-safe (position:fixed) instead of overflow:hidden
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!cartOpen) return

    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'

    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, scrollY)
    }
  }, [cartOpen])

  // ---------------------------------------------------------------------------
  // Focus trap — keep Tab/Shift+Tab inside the drawer when it's open
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!cartOpen) return

    // Move initial focus to the close button.
    closeButtonRef.current?.focus()

    const drawer = drawerRef.current
    if (!drawer) return

    const FOCUSABLE =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeCart()
        return
      }

      if (e.key !== 'Tab') return

      const focusable = Array.from(drawer!.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [cartOpen, closeCart])

  if (!cartOpen) return null

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Shopping cart">
      {/* Backdrop */}
      <button
        type="button"
        className="animate-fade-in absolute inset-0 bg-earth-950/45"
        aria-label="Close cart"
        onClick={closeCart}
        tabIndex={-1}
      />

      {/* Drawer */}
      <aside
        ref={drawerRef}
        className="animate-slide-in-right absolute bottom-0 right-0 top-0 flex w-full max-w-md flex-col bg-white shadow-[var(--shadow-premium)] sm:max-w-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-earth-200 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-earth-700" aria-hidden />
            <h2 className="text-base font-semibold text-earth-900">
              Cart {totalItems > 0 && <span className="text-earth-500">({totalItems})</span>}
            </h2>
          </div>
          <Button
            ref={closeButtonRef}
            variant="ghost"
            size="icon"
            className="h-11 w-11"
            onClick={closeCart}
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Free-shipping progress */}
        {items.length > 0 && (
          <div className="border-b border-earth-100 px-5 py-3">
            <FreeShippingProgress subtotal={totalPrice} />
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-earth-100">
              <ShoppingBag className="h-7 w-7 text-earth-400" strokeWidth={1.5} />
            </div>
            <p className="mt-4 text-base font-semibold text-earth-900">Your cart is empty</p>
            <p className="mt-1 text-sm text-earth-600">Add products to get started.</p>
            <Link href="/shop" className="mt-5 no-underline" onClick={closeCart}>
              <Button size="lg" className="h-11 px-6">Start shopping</Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Item list */}
            <ul className="flex-1 space-y-2 overflow-y-auto p-4">
              {items.map(({ product, quantity }) => (
                <li
                  key={product.id}
                  className="flex gap-3 rounded-lg border border-earth-200 bg-white p-3"
                >
                  <Link
                    href={`/products/${product.id}`}
                    className="shrink-0 no-underline"
                    onClick={closeCart}
                  >
                    <ProductImage
                      src={product.image_url}
                      alt={product.name}
                      className="h-16 w-16 rounded-md"
                      sizes="64px"
                      framed={false}
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      href={`/products/${product.id}`}
                      className="line-clamp-2 text-sm font-medium text-earth-900 no-underline hover:text-brand-700"
                      onClick={closeCart}
                    >
                      {product.name}
                    </Link>
                    <p className="mt-0.5 text-sm font-semibold text-earth-900">
                      {formatMoney(product.price)}
                    </p>

                    <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                      {/* Quantity controls — min 44×44 tap target per AGENTS.md */}
                      <div className="inline-flex items-center rounded-md border border-earth-200">
                        <button
                          type="button"
                          className="flex h-11 w-11 items-center justify-center text-earth-700 transition-colors hover:bg-earth-50 disabled:opacity-40"
                          aria-label={`Decrease quantity of ${product.name}`}
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
                          aria-label={`Increase quantity of ${product.name}`}
                          onClick={() => updateQuantity(product.id, Math.min(99, quantity + 1))}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        className="inline-flex min-h-11 items-center px-2 text-xs font-medium text-earth-500 transition-colors hover:text-red-600"
                        onClick={() => removeItem(product.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Footer */}
            <div className="border-t border-earth-200 bg-white p-5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-earth-600">Subtotal</span>
                <span className="text-xl font-semibold tracking-tight text-earth-900 tabular-nums">
                  {formatMoney(totalPrice)}
                </span>
              </div>
              <p className="mt-1 text-xs text-earth-500">Shipping at checkout</p>
              <Link href="/checkout" className="mt-4 block no-underline" onClick={closeCart}>
                <Button size="lg" className="h-11 w-full">
                  Checkout
                </Button>
              </Link>
              <div className="mt-3 flex items-center justify-between text-sm">
                <Link
                  href="/cart"
                  className="font-medium text-earth-700 no-underline hover:text-earth-900"
                  onClick={closeCart}
                >
                  View full cart
                </Link>
                <Link
                  href="/shop"
                  className="font-medium text-brand-700 no-underline hover:text-brand-800"
                  onClick={closeCart}
                >
                  ← Continue shopping
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
