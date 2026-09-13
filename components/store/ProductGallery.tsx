'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toStorefrontImageUrl } from '@/lib/product-image-url'
import { cn } from '@/lib/utils'

type Props = {
  mainImage: string | null
  extraImages?: string[] | null
  productName: string
}

export function ProductGallery({ mainImage, extraImages, productName }: Props) {
  const allImages = [
    ...(mainImage ? [mainImage] : []),
    ...((extraImages ?? []).filter((u) => u && u !== mainImage)),
  ]
    .map((u) => toStorefrontImageUrl(u))
    .filter((u): u is string => Boolean(u))

  const [active, setActive] = useState(0)
  const [failed, setFailed] = useState<Record<number, boolean>>({})

  if (allImages.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-earth-200 bg-earth-50 aspect-square flex items-center justify-center">
        <p className="text-sm text-earth-400">No image</p>
      </div>
    )
  }

  const safeActive = Math.min(active, allImages.length - 1)
  const activeSrc = allImages[safeActive]
  const activeFailed = failed[safeActive]

  function prev() {
    setActive((i) => (i === 0 ? allImages.length - 1 : i - 1))
  }
  function next() {
    setActive((i) => (i === allImages.length - 1 ? 0 : i + 1))
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl border border-earth-200 bg-earth-50 aspect-square">
        {activeFailed ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-earth-400">Photo unavailable</p>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- product photos use same-origin proxy
          <img
            key={activeSrc}
            src={activeSrc}
            alt={`${productName} — photo ${safeActive + 1}`}
            className="absolute inset-0 h-full w-full object-contain p-2"
            sizes="(max-width:1024px) 100vw, 50vw"
            loading={safeActive === 0 ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={safeActive === 0 ? 'high' : undefined}
            referrerPolicy="no-referrer"
            onError={() => setFailed((prev) => ({ ...prev, [safeActive]: true }))}
          />
        )}

        {allImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md transition-colors hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5 text-earth-700" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md transition-colors hover:bg-white"
            >
              <ChevronRight className="h-5 w-5 text-earth-700" />
            </button>

            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-0.5">
              {allImages.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Photo ${i + 1}`}
                  className="flex h-11 w-11 items-center justify-center"
                >
                  <span
                    className={cn(
                      'h-2 rounded-full transition-all',
                      i === safeActive ? 'w-5 bg-brand-700' : 'w-2 bg-earth-300'
                    )}
                    aria-hidden
                  />
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {allImages.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View photo ${i + 1}`}
              className={cn(
                'relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors',
                i === safeActive
                  ? 'border-brand-500'
                  : 'border-earth-200 hover:border-earth-300'
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- product photos use same-origin proxy */}
              <img
                src={src}
                alt=""
                className="absolute inset-0 h-full w-full object-contain p-1"
                sizes="64px"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
