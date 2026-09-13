'use client'

import { useState } from 'react'
import { Package } from 'lucide-react'
import { toStorefrontImageUrl } from '@/lib/product-image-url'
import { cn } from '@/lib/utils'

type ProductImageProps = {
  src: string | null
  alt: string
  className?: string
  sizes?: string
  priority?: boolean
  framed?: boolean
  /** Subtle zoom on card hover (off by default per design system). */
  hoverZoom?: boolean
  showPlaceholderHint?: boolean
}

/**
 * Native <img> for product photos — same-origin `/media/...` proxy so CSP
 * never blocks Supabase storage URLs.
 */
export function ProductImage({
  src,
  alt,
  className,
  sizes = '(max-width:640px) 50vw, 25vw',
  priority,
  framed = true,
  hoverZoom = false,
  showPlaceholderHint = false,
}: ProductImageProps) {
  const resolved = toStorefrontImageUrl(src)
  const [failed, setFailed] = useState(false)

  if (!resolved || failed) {
    return (
      <div
        className={cn(
          framed
            ? 'product-image-frame'
            : 'flex aspect-square flex-col items-center justify-center gap-1 bg-white',
          className
        )}
        role="img"
        aria-label={alt}
      >
        <Package className="h-10 w-10 text-earth-400 sm:h-12 sm:w-12" strokeWidth={1.25} aria-hidden />
        {showPlaceholderHint && (
          <span className="text-[10px] font-medium text-earth-400">Photo soon</span>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        framed ? 'product-image-frame' : 'relative aspect-square bg-white',
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- product photos use same-origin proxy */}
      <img
        src={resolved}
        alt={alt}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : undefined}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={cn(
          'absolute inset-0 h-full w-full object-contain p-3 sm:p-4',
          hoverZoom && 'transition-transform duration-150 ease-out group-hover:scale-[1.02]'
        )}
      />
    </div>
  )
}
