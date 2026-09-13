'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type AdminAnnouncement = {
  id: string
  message: string
  href: string | null
  sort_order: number
  active: boolean
  created_at?: string
  updated_at?: string
}

type Draft = {
  message: string
  href: string
  sort_order: number
  active: boolean
}

function toDraft(row: AdminAnnouncement): Draft {
  return {
    message: row.message,
    href: row.href ?? '',
    sort_order: row.sort_order,
    active: row.active,
  }
}

export function AnnouncementsAdmin({ initial }: { initial: AdminAnnouncement[] }) {
  const router = useRouter()
  const [rows, setRows] = useState(initial)
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(initial.map((r) => [r.id, toDraft(r)]))
  )
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newDraft, setNewDraft] = useState<Draft>({
    message: '',
    href: '',
    sort_order: initial.length,
    active: true,
  })

  function updateDraft(id: string, patch: Partial<Draft>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  async function save(id: string) {
    const draft = drafts[id]
    if (!draft) return
    setBusy(id)
    setError(null)
    const res = await fetch(`/api/admin/announcements/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: draft.message,
        href: draft.href.trim() || null,
        sort_order: draft.sort_order,
        active: draft.active,
      }),
    })
    setBusy(null)
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? 'Could not save.')
      return
    }
    const updated = (await res.json()) as AdminAnnouncement
    setRows((prev) => prev.map((r) => (r.id === id ? updated : r)))
    setDrafts((prev) => ({ ...prev, [id]: toDraft(updated) }))
    router.refresh()
  }

  async function remove(id: string) {
    if (!confirm('Delete this announcement?')) return
    setBusy(id)
    setError(null)
    const res = await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' })
    setBusy(null)
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? 'Could not delete.')
      return
    }
    setRows((prev) => prev.filter((r) => r.id !== id))
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    router.refresh()
  }

  async function create() {
    setCreating(true)
    setError(null)
    const res = await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: newDraft.message,
        href: newDraft.href.trim() || null,
        sort_order: newDraft.sort_order,
        active: newDraft.active,
      }),
    })
    setCreating(false)
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? 'Could not create.')
      return
    }
    const created = (await res.json()) as AdminAnnouncement
    setRows((prev) => [...prev, created].sort((a, b) => a.sort_order - b.sort_order))
    setDrafts((prev) => ({ ...prev, [created.id]: toDraft(created) }))
    setNewDraft({
      message: '',
      href: '',
      sort_order: rows.length + 1,
      active: true,
    })
    router.refresh()
  }

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="admin-card space-y-4">
        <h2 className="admin-section-title">Add announcement</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-earth-700">Message</span>
            <input
              className="form-input w-full"
              value={newDraft.message}
              onChange={(e) => setNewDraft((d) => ({ ...d, message: e.target.value }))}
              maxLength={280}
              placeholder="Free shipping on $120+"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-earth-700">Link (optional)</span>
            <input
              className="form-input w-full"
              value={newDraft.href}
              onChange={(e) => setNewDraft((d) => ({ ...d, href: e.target.value }))}
              placeholder="/shipping or https://…"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-earth-700">Sort order</span>
            <input
              type="number"
              className="form-input w-full"
              value={newDraft.sort_order}
              onChange={(e) =>
                setNewDraft((d) => ({ ...d, sort_order: Number(e.target.value) || 0 }))
              }
            />
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-earth-700">
            <input
              type="checkbox"
              checked={newDraft.active}
              onChange={(e) => setNewDraft((d) => ({ ...d, active: e.target.checked }))}
            />
            Active
          </label>
        </div>
        <Button
          type="button"
          onClick={create}
          disabled={creating || !newDraft.message.trim()}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add message
        </Button>
      </section>

      <section>
        <h2 className="admin-section-title mb-3">
          Messages
          <span className="ml-2 text-xs font-medium text-earth-400">({rows.length})</span>
        </h2>
        {rows.length === 0 ? (
          <div className="admin-card text-center text-sm text-earth-500">
            No announcements yet.
          </div>
        ) : (
          <ul className="space-y-3">
            {rows.map((row) => {
              const draft = drafts[row.id] ?? toDraft(row)
              return (
                <li key={row.id} className="admin-card space-y-3">
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-earth-700">Message</span>
                    <input
                      className="form-input w-full"
                      value={draft.message}
                      onChange={(e) => updateDraft(row.id, { message: e.target.value })}
                      maxLength={280}
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="block text-sm sm:col-span-2">
                      <span className="mb-1 block font-medium text-earth-700">Link</span>
                      <input
                        className="form-input w-full"
                        value={draft.href}
                        onChange={(e) => updateDraft(row.id, { href: e.target.value })}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-earth-700">Sort</span>
                      <input
                        type="number"
                        className="form-input w-full"
                        value={draft.sort_order}
                        onChange={(e) =>
                          updateDraft(row.id, { sort_order: Number(e.target.value) || 0 })
                        }
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-earth-700">
                      <input
                        type="checkbox"
                        checked={draft.active}
                        onChange={(e) => updateDraft(row.id, { active: e.target.checked })}
                      />
                      Active
                    </label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => save(row.id)}
                      disabled={busy === row.id || !draft.message.trim()}
                    >
                      Save
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => remove(row.id)}
                      disabled={busy === row.id}
                      className="gap-1.5 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      Delete
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
