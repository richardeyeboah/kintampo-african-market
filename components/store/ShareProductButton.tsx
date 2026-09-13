'use client'

import { useEffect, useState } from 'react'
import { Check, Share2 } from 'lucide-react'
import { getPublicProductUrl } from '@/lib/product-url'
import { cn } from '@/lib/utils'

type ShareState = 'idle' | 'copied' | 'error'

/**
 * Shares only the public product page (`/products/{id}`).
 * Never uses `window.location` so admin/query/session URLs cannot leak.
 */
export function ShareProductButton({
  productId,
  productName,
  compact = false,
}: {
  productId: string
  productName: string
  compact?: boolean
}) {
  const [state, setState] = useState<ShareState>('idle')

  useEffect(() => {
    if (state === 'idle') return
    const t = setTimeout(() => setState('idle'), 1800)
    return () => clearTimeout(t)
  }, [state])

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setState('copied')
    } catch {
      setState('error')
    }
  }

  async function share() {
    let url: string
    try {
      url = getPublicProductUrl(productId)
    } catch {
      setState('error')
      return
    }

    const title = productName.trim() || 'Kintampo African Market'
    const text = `${title} — order at Kintampo African Market`

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text, url })
        return
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        // Fall through to clipboard if the sheet fails.
      }
    }

    await copyLink(url)
  }

  const label =
    state === 'copied' ? 'Link copied' : state === 'error' ? 'Could not share' : 'Share product'

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void share()
      }}
      aria-label={label}
      title={label}
      className={cn(
        'flex min-h-11 min-w-11 items-center justify-center rounded-full border transition-colors duration-150',
        compact ? 'h-11 w-11 shadow-sm' : 'h-11 w-11',
        state === 'copied'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : state === 'error'
            ? 'border-red-200 bg-red-50 text-red-600'
            : 'border-earth-200 bg-white/95 text-earth-500 hover:border-earth-300 hover:text-earth-800'
      )}
    >
      {state === 'copied' ? (
        <Check className="h-4 w-4" strokeWidth={2} aria-hidden />
      ) : (
        <Share2 className="h-4 w-4" strokeWidth={2} aria-hidden />
      )}
    </button>
  )
}
