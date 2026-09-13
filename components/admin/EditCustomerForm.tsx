'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function EditCustomerForm({
  customerId,
  initialName,
  initialPhone,
}: {
  customerId: string
  initialName: string | null
  initialPhone: string | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(initialName ?? '')
  const [phone, setPhone] = useState(initialPhone ?? '')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSaved(false)
    setError('')
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name, phone }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Could not update customer.')
        return
      }
      setSaved(true)
      setOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800"
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit profile
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-lg border border-earth-200 bg-earth-50 p-4">
      <p className="text-sm font-semibold text-earth-900">Edit customer</p>
      <div className="space-y-1.5">
        <label className="form-label">Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" maxLength={100} />
      </div>
      <div className="space-y-1.5">
        <label className="form-label">Phone</label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" maxLength={30} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && (
        <p className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
          <Check className="h-4 w-4" /> Saved
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
