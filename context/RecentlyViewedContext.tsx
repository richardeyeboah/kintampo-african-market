'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Product } from '@/types'

type RecentlyViewedContextType = {
  items: Product[]
  add: (product: Product) => void
  clear: () => void
}

const RecentlyViewedContext = createContext<RecentlyViewedContextType | null>(null)

const STORAGE_KEY = 'lqam-recently-viewed'
const MAX_ITEMS = 12

function parse(raw: string | null): Product[] {
  if (!raw) return []
  try {
    const data = JSON.parse(raw) as unknown
    return Array.isArray(data) ? (data as Product[]) : []
  } catch {
    return []
  }
}

export function RecentlyViewedProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>([])

  useEffect(() => {
    const t = window.setTimeout(() => {
      setItems(parse(localStorage.getItem(STORAGE_KEY)))
    }, 0)
    return () => window.clearTimeout(t)
  }, [])

  const add = useCallback((product: Product) => {
    if (!product?.id) return
    setItems((prev) => {
      const next = [product, ...prev.filter((p) => p.id !== product.id)].slice(0, MAX_ITEMS)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        return prev
      }
      return next
    })
  }, [])

  const clear = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
    } catch {
      return
    }
    setItems([])
  }, [])

  const value = useMemo(() => ({ items, add, clear }), [items, add, clear])

  return (
    <RecentlyViewedContext.Provider value={value}>{children}</RecentlyViewedContext.Provider>
  )
}

export function useRecentlyViewed() {
  const ctx = useContext(RecentlyViewedContext)
  if (!ctx) {
    return { items: [] as Product[], add: () => {}, clear: () => {} }
  }
  return ctx
}
