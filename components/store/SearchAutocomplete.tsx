'use client'

import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { Search, X } from 'lucide-react'
import { ProductImage } from '@/components/store/ProductImage'
import { parseShopDept } from '@/lib/constants/categories'
import { cn, formatMoney } from '@/lib/utils'
import type { Product } from '@/types'

type Props = {
  className?: string
  compact?: boolean
  placeholder?: string
}

const POPULAR_GROCERY = ['jollof rice', 'palm oil', 'plantain', 'goat meat', 'malt']
const POPULAR_FASHION = ['ankara', 'lace', 'headtie', 'kente', 'hollandais', 'ready-to-wear']

export function SearchAutocomplete({ className, compact, placeholder }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const fashionHub =
    pathname === '/fashion' || parseShopDept(searchParams.get('dept')) === 'fashion'

  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const listboxId = useId()

  const trimmed = q.trim()
  const popular = fashionHub ? POPULAR_FASHION : POPULAR_GROCERY

  const resultsHref = useCallback(
    (term?: string) => {
      const t = term?.trim()
      if (fashionHub) {
        return t ? `/fashion?q=${encodeURIComponent(t)}` : '/fashion'
      }
      return t ? `/shop?q=${encodeURIComponent(t)}` : '/shop'
    },
    [fashionHub]
  )

  useEffect(() => {
    if (!trimmed) {
      setResults([])
      setLoading(false)
      abortRef.current?.abort()
      return
    }

    setLoading(true)
    const t = window.setTimeout(async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const params = new URLSearchParams({
          q: trimmed,
          limit: '6',
        })
        if (fashionHub) params.set('dept', 'fashion')
        const res = await fetch(`/api/search?${params}`, {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error('search failed')
        const data = (await res.json()) as { products: Product[] }
        setResults(data.products ?? [])
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setResults([])
      } finally {
        setLoading(false)
      }
    }, 160)

    return () => window.clearTimeout(t)
  }, [trimmed, fashionHub])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    setHighlight(-1)
  }, [])

  const submit = useCallback(
    (forced?: string) => {
      const term = (forced ?? trimmed).trim()
      router.push(resultsHref(term))
      close()
    },
    [router, trimmed, close, resultsHref]
  )

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setHighlight((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      if (highlight >= 0 && results[highlight]) {
        e.preventDefault()
        router.push(`/products/${results[highlight].id}`)
        close()
      }
    } else if (e.key === 'Escape') {
      close()
      inputRef.current?.blur()
    }
  }

  const showDropdown = open && (loading || results.length > 0 || trimmed.length === 0)

  const popularPills = useMemo(
    () =>
      popular.map((term) => (
        <button
          key={term}
          type="button"
          className="inline-flex min-h-11 items-center rounded-full bg-earth-100 px-3 py-2 text-[11px] font-medium text-earth-700 transition-colors hover:bg-earth-200"
          onClick={() => {
            setQ(term)
            submit(term)
          }}
        >
          {term}
        </button>
      )),
    [popular, submit]
  )

  const searchPlaceholder = fashionHub
    ? compact
      ? 'Search fashion…'
      : 'Search prints, lace, ready-to-wear, hair…'
    : placeholder ?? (compact ? 'Search products…' : 'Search products, brands, categories…')

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className={cn(
          'flex items-center gap-2 rounded-xl border border-earth-200 bg-white transition-shadow duration-150',
          compact ? 'px-2 py-0.5' : 'px-3 shadow-[var(--shadow-card)]',
          open && 'border-brand-500 ring-4 ring-brand-500/15'
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-earth-400" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
            setHighlight(-1)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={searchPlaceholder}
          aria-label={fashionHub ? 'Search fashion' : 'Search products'}
          aria-autocomplete="list"
          aria-controls={listboxId}
          className={cn(
            'min-w-0 flex-1 bg-transparent text-base text-earth-900 placeholder:text-earth-400 focus:outline-none sm:text-sm',
            compact ? 'h-11' : 'h-11'
          )}
        />
        {q ? (
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-md text-earth-400 transition-colors hover:bg-earth-100 hover:text-earth-700"
            aria-label="Clear search"
            onClick={() => {
              setQ('')
              setResults([])
              inputRef.current?.focus()
            }}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
        <button
          type="submit"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-earth-900 text-white transition-colors hover:bg-earth-800"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </button>
      </form>

      {showDropdown && (
        <div
          id={listboxId}
          role="listbox"
          className="animate-fade-in absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-earth-200 bg-white shadow-[var(--shadow-premium)]"
        >
          {!trimmed ? (
            <div className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-earth-500">
                {fashionHub ? 'Popular in fashion' : 'Popular searches'}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">{popularPills}</div>
            </div>
          ) : loading && results.length === 0 ? (
            <div className="space-y-2 px-4 py-3" role="status" aria-live="polite">
              <p className="text-sm text-earth-500">Searching…</p>
              <div className="skeleton h-10 w-full rounded-md" />
              <div className="skeleton h-10 w-[92%] rounded-md" />
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-4 text-sm text-earth-500">
              No products match &ldquo;{trimmed}&rdquo;.
              <button
                type="button"
                onClick={() => submit()}
                className="ml-2 font-semibold text-brand-700 hover:underline"
              >
                Search anyway →
              </button>
            </div>
          ) : (
            <>
              <ul className="max-h-[26rem] overflow-y-auto py-1">
                {results.map((p, i) => (
                  <li key={p.id} role="option" aria-selected={highlight === i}>
                    <Link
                      href={`/products/${p.id}`}
                      onClick={close}
                      onMouseEnter={() => setHighlight(i)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 no-underline transition-colors',
                        highlight === i ? 'bg-earth-50' : 'hover:bg-earth-50'
                      )}
                    >
                      <ProductImage
                        src={p.image_url}
                        alt={p.name}
                        className="h-12 w-12 shrink-0 rounded-md"
                        sizes="48px"
                        framed={false}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-medium text-earth-900">{p.name}</p>
                        <p className="text-[11px] text-earth-500">{p.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-earth-900 tabular-nums">
                          {formatMoney(p.price)}
                        </p>
                        {!p.in_stock && (
                          <p className="text-[10px] font-medium uppercase tracking-wider text-earth-400">
                            Out
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => submit()}
                className="block w-full border-t border-earth-100 bg-earth-50 px-4 py-2.5 text-left text-xs font-semibold text-brand-700 transition-colors hover:bg-earth-100"
              >
                See all results for &ldquo;{trimmed}&rdquo; →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
