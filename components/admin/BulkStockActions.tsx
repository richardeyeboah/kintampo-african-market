'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function BulkStockActions({ ids }: { ids: string[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function update(inStock: boolean) {
    if (!ids.length) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/products/bulk-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, in_stock: inStock }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Bulk update failed.')
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  if (!ids.length) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-earth-700">{ids.length} selected:</span>
      <button
        type="button"
        onClick={() => update(true)}
        disabled={loading}
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        Mark in stock
      </button>
      <button
        type="button"
        onClick={() => update(false)}
        disabled={loading}
        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        Mark out of stock
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
