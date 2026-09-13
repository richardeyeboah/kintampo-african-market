'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, StickyNote } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AdminNotePanel({
  orderId,
  currentStatus,
}: {
  orderId: string
  currentStatus: string
}) {
  const router = useRouter()
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!note.trim()) return
    setLoading(true)
    setSaved(false)
    setError('')
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: currentStatus, note }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Could not save note.')
        return
      }
      setNote('')
      setSaved(true)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2 text-earth-700">
        <StickyNote className="h-4 w-4 text-earth-400" aria-hidden />
        <span className="text-sm font-medium">Internal note</span>
        <span className="text-xs text-earth-400">(not sent to customer)</span>
      </div>
      <textarea
        rows={3}
        className="form-input w-full"
        placeholder="Internal note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={500}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-earth-400">{note.length}/500</p>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
              <Check className="h-4 w-4" strokeWidth={2.5} /> Saved
            </span>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" size="sm" disabled={loading || !note.trim()}>
            {loading ? 'Saving…' : 'Add note'}
          </Button>
        </div>
      </div>
    </form>
  )
}
