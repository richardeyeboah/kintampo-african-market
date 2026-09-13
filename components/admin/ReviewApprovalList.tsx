'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Star, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Review = {
  id: string
  product_id: string
  reviewer_name: string
  rating: number
  comment: string | null
  created_at: string
  products: { name: string } | { name: string }[] | null
}

function reviewProductName(products: Review['products']): string | null {
  if (!products) return null
  if (Array.isArray(products)) return products[0]?.name ?? null
  return products.name
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'fill-earth-200 text-earth-200'}`}
        />
      ))}
    </span>
  )
}

export type AdminReview = Review

export function ReviewApprovalList({
  pending,
  approved,
}: {
  pending: Review[]
  approved: Review[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function approve(id: string) {
    setLoading(id)
    const res = await fetch(`/api/admin/reviews/${id}/approve`, { method: 'POST' })
    setLoading(null)
    if (res.ok) router.refresh()
  }

  async function reject(id: string) {
    if (!confirm('Delete this review?')) return
    setLoading(id)
    const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' })
    setLoading(null)
    if (res.ok) router.refresh()
  }

  return (
    <div className="space-y-8">
      {/* Pending */}
      <section>
        <h2 className="admin-section-title mb-3">
          Pending approval
          {pending.length > 0 && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
              {pending.length}
            </span>
          )}
        </h2>
        {pending.length === 0 ? (
          <div className="admin-card text-center text-sm text-earth-500">
            No reviews waiting — you&apos;re all caught up ✓
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((r) => (
              <div key={r.id} className="admin-card space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-earth-900">{r.reviewer_name}</p>
                    <p className="text-xs text-earth-500">{reviewProductName(r.products) ?? r.product_id}</p>
                    <Stars rating={r.rating} />
                  </div>
                  <p className="text-xs text-earth-400">
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                {r.comment && (
                  <p className="text-sm text-earth-700 leading-relaxed">{r.comment}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => approve(r.id)}
                    disabled={loading === r.id}
                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => reject(r.id)}
                    disabled={loading === r.id}
                    className="gap-1.5 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Approved */}
      {approved.length > 0 && (
        <section>
          <h2 className="admin-section-title mb-3">Recently approved ({approved.length})</h2>
          <div className="admin-table-wrap overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Reviewer</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {approved.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium text-earth-900">{reviewProductName(r.products) ?? '—'}</td>
                    <td>{r.reviewer_name}</td>
                    <td><Stars rating={r.rating} /></td>
                    <td className="max-w-xs truncate text-earth-600">{r.comment ?? '—'}</td>
                    <td className="text-earth-500">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => reject(r.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
