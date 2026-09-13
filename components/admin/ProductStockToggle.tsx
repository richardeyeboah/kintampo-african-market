'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function ProductStockToggle({
  id,
  inStock,
}: {
  id: string
  inStock: boolean | null
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const stocked = Boolean(inStock)

  async function toggle() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ in_stock: !stocked }),
      })
      if (res.ok) router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={`admin-status-pill ${stocked ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}
      >
        {stocked ? 'In stock' : 'Out'}
      </span>
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        className="rounded-md border border-earth-200 bg-white px-2 py-1 text-[11px] font-medium text-earth-700 transition-colors hover:border-earth-300 hover:bg-earth-50 disabled:opacity-50"
        aria-label={stocked ? 'Mark out of stock' : 'Mark in stock'}
      >
        {loading ? '…' : stocked ? 'Mark out' : 'Mark in'}
      </button>
    </div>
  )
}
