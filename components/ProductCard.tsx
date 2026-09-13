'use client'

import Link from 'next/link'
import { Check, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { ProductImage } from '@/components/store/ProductImage'
import { WishlistButton } from '@/components/store/WishlistButton'
import { Button } from '@/components/ui/button'
import { ProductStockLabel } from '@/components/store/ProductStockLabel'
import { packLabel, formatUnitPrice, effectiveInStock, lowStockCount } from '@/lib/product-pricing'
import { formatMoney } from '@/lib/utils'
import type { Product } from '@/types'

export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const { addItem } = useCart()
  const toast = useToast()
  const [justAdded, setJustAdded] = useState(false)
  const inStock = effectiveInStock(product)
  const packSize = packLabel(product)
  const unitPrice = formatUnitPrice(product)
  const low = lowStockCount(product)

  useEffect(() => {
    if (!justAdded) return
    const t = setTimeout(() => setJustAdded(false), 180)
    return () => clearTimeout(t)
  }, [justAdded])

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!inStock) return
    addItem(product, 1)
    toast?.show(`Added: ${product.name}`)
    setJustAdded(true)
  }

  return (
    <article className="group premium-card premium-card-hover flex h-full min-w-0 flex-col">
      <Link href={`/products/${product.id}`} className="flex flex-1 flex-col no-underline">
        <div className="relative">
          {!inStock && (
            <span className="absolute left-3 top-3 z-10 rounded-full bg-earth-900/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white">
              Out of stock
            </span>
          )}
          {inStock && low != null && (
            <span className="absolute left-3 top-3 z-10 rounded-full bg-amber-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
              Only {low} left
            </span>
          )}
          <div
            className="absolute right-2 top-2 z-10"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
          >
            <WishlistButton productId={product.id} compact />
          </div>
          <div className="product-image-frame">
            <div className="h-full w-full transition-transform duration-200 ease-out group-hover:scale-[1.03]">
              <ProductImage
                src={product.image_url}
                alt={product.name}
                className="rounded-none"
                sizes="(max-width:640px) 50vw, 25vw"
                priority={priority}
                showPlaceholderHint
              />
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <p className="line-clamp-1 text-[10px] font-medium uppercase tracking-[0.14em] text-earth-500">
            {product.brand?.trim() || product.category}
          </p>
          <h3 className="mt-2 line-clamp-2 text-[14px] font-medium leading-snug text-earth-900 transition-colors duration-200 group-hover:text-earth-600 sm:text-[15px]">
            {product.name}
          </h3>
          {product.description && (
            <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-earth-500">
              {product.description}
            </p>
          )}
          {(inStock || packSize) && (
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
              {inStock && (
                <ProductStockLabel
                  inStock
                  stockQuantity={product.stock_quantity}
                  compact
                />
              )}
              {packSize && (
                <span className="text-[11px] font-medium text-earth-500">{packSize}</span>
              )}
            </div>
          )}
          <div className="mt-auto pt-4">
            <p className="text-[17px] font-semibold tabular-nums tracking-tight text-earth-900">
              {formatMoney(product.price)}
            </p>
            {unitPrice && (
              <p className="mt-0.5 text-[11px] font-medium tabular-nums text-earth-500">
                {unitPrice}
              </p>
            )}
          </div>
        </div>
      </Link>
      <div className="px-3 pb-3 sm:px-4 sm:pb-4">
        <Button
          type="button"
          variant={inStock ? 'default' : 'outline'}
          size="sm"
          className="h-11 w-full gap-1.5 text-[13px]"
          disabled={!inStock}
          onClick={handleAdd}
          aria-label={inStock ? `Add ${product.name} to cart` : 'Unavailable'}
        >
          {justAdded ? (
            <>
              <Check className="h-4 w-4" aria-hidden />
              Added
            </>
          ) : inStock ? (
            <>
              <Plus className="h-4 w-4" aria-hidden />
              Add to cart
            </>
          ) : (
            'Unavailable'
          )}
        </Button>
      </div>
    </article>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="premium-card flex h-full flex-col">
      <div className="skeleton aspect-square" />
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-3.5">
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-2/3 rounded" />
        <div className="skeleton mt-auto h-5 w-1/3 rounded pt-3" />
      </div>
      <div className="border-t border-earth-100 p-2">
        <div className="skeleton h-11 w-full rounded-md" />
      </div>
    </div>
  )
}

export function ProductCardMini({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.id}`} className="flex gap-3 no-underline">
      <ProductImage
        src={product.image_url}
        alt={product.name}
        className="h-16 w-16 rounded-md"
        sizes="64px"
        framed={false}
      />
      <div>
        <p className="line-clamp-2 text-sm font-medium text-earth-900">{product.name}</p>
        <p className="text-sm font-semibold text-earth-900">{formatMoney(product.price)}</p>
      </div>
    </Link>
  )
}
