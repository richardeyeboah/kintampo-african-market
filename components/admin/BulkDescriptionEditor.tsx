'use client'

import { useState } from 'react'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Product = {
  id: string
  name: string
  category: string | null
  description: string | null
}

export function BulkDescriptionEditor({ products }: { products: Product[] }) {
  const [descriptions, setDescriptions] = useState<Record<string, string>>(
    Object.fromEntries(products.map((p) => [p.id, p.description ?? '']))
  )
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const missing = products.filter((p) => !p.description?.trim())
  const withDesc = products.filter((p) => p.description?.trim())

  async function saveOne(id: string) {
    setSaving((s) => ({ ...s, [id]: true }))
    setErrors((e) => ({ ...e, [id]: '' }))
    setSaved((s) => ({ ...s, [id]: false }))
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: descriptions[id] }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setErrors((e) => ({ ...e, [id]: data.error ?? 'Save failed.' }))
        return
      }
      setSaved((s) => ({ ...s, [id]: true }))
      setTimeout(() => setSaved((s) => ({ ...s, [id]: false })), 2000)
    } finally {
      setSaving((s) => ({ ...s, [id]: false }))
    }
  }

  function ProductRow({ product }: { product: Product }) {
    const isCollapsed = collapsed[product.id]
    return (
      <div className="rounded-xl border border-earth-200 bg-white overflow-hidden">
        <button
          type="button"
          onClick={() => setCollapsed((c) => ({ ...c, [product.id]: !c[product.id] }))}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-earth-50 transition-colors"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-earth-900">{product.name}</p>
            <p className="text-xs text-earth-500">{product.category ?? '—'}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {descriptions[product.id]?.trim() ? (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Has description</span>
            ) : (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">No description</span>
            )}
            {isCollapsed ? <ChevronDown className="h-4 w-4 text-earth-400" /> : <ChevronUp className="h-4 w-4 text-earth-400" />}
          </div>
        </button>

        {!isCollapsed && (
          <div className="border-t border-earth-100 px-4 pb-4 pt-3 space-y-2">
            <textarea
              rows={3}
              className="form-input w-full text-sm"
              placeholder={`Describe ${product.name}`}
              value={descriptions[product.id] ?? ''}
              onChange={(e) => setDescriptions((d) => ({ ...d, [product.id]: e.target.value }))}
              maxLength={5000}
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-earth-400">
                {(descriptions[product.id] ?? '').length}/5000
              </span>
              <div className="flex items-center gap-2">
                {errors[product.id] && (
                  <p className="text-xs text-red-600">{errors[product.id]}</p>
                )}
                {saved[product.id] && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                    <Check className="h-3.5 w-3.5" /> Saved
                  </span>
                )}
                <Button
                  type="button"
                  size="sm"
                  disabled={saving[product.id]}
                  onClick={() => saveOne(product.id)}
                >
                  {saving[product.id] ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 text-sm text-earth-600">
        <span><strong className="text-amber-700">{missing.length}</strong> missing descriptions</span>
        <span><strong className="text-emerald-700">{withDesc.length}</strong> have descriptions</span>
      </div>

      {missing.length > 0 && (
        <section className="space-y-3">
          <h2 className="admin-section-title text-amber-800">Missing descriptions ({missing.length})</h2>
          {missing.map((p) => <ProductRow key={p.id} product={p} />)}
        </section>
      )}

      {withDesc.length > 0 && (
        <section className="space-y-3">
          <h2 className="admin-section-title">Already have descriptions ({withDesc.length})</h2>
          {withDesc.map((p) => <ProductRow key={p.id} product={p} />)}
        </section>
      )}
    </div>
  )
}
