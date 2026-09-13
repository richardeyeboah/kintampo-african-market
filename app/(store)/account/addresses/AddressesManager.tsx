'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { MapPin, Plus, Star } from 'lucide-react'
import { createClient, isSupabaseBrowserConfigured } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export type AddressRow = {
  id: string
  user_id: string
  label: string | null
  full_name: string
  phone: string | null
  line1: string
  line2: string | null
  city: string
  state: string
  country: string
  postal_code: string
  is_default: boolean
  created_at: string
  updated_at: string
}

type Draft = {
  id?: string
  label: string
  full_name: string
  phone: string
  line1: string
  line2: string
  city: string
  state: string
  country: string
  postal_code: string
  is_default: boolean
}

const empty: Draft = {
  label: '',
  full_name: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  country: 'United States',
  postal_code: '',
  is_default: false,
}

const COUNTRIES = ['United States', 'Canada', 'United Kingdom', 'Mexico']

export function AddressesManager({ userId, initial }: { userId: string; initial: AddressRow[] }) {
  const router = useRouter()
  const [addresses, setAddresses] = useState(initial)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function startNew() {
    setDraft({ ...empty })
    setError('')
  }

  function startEdit(a: AddressRow) {
    setDraft({
      id: a.id,
      label: a.label ?? '',
      full_name: a.full_name,
      phone: a.phone ?? '',
      line1: a.line1,
      line2: a.line2 ?? '',
      city: a.city,
      state: a.state,
      country: a.country,
      postal_code: a.postal_code,
      is_default: a.is_default,
    })
    setError('')
  }

  function cancel() {
    setDraft(null)
    setError('')
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!draft) return
    if (!isSupabaseBrowserConfigured()) {
      setError('Saving is temporarily unavailable.')
      return
    }
    setSaving(true)
    setError('')
    const supabase = createClient()

    const row = {
      user_id: userId,
      label: draft.label.trim() || null,
      full_name: draft.full_name.trim(),
      phone: draft.phone.trim() || null,
      line1: draft.line1.trim(),
      line2: draft.line2.trim() || null,
      city: draft.city.trim(),
      state: draft.state.trim(),
      country: draft.country.trim(),
      postal_code: draft.postal_code.trim(),
      is_default: draft.is_default,
    }

    if (draft.is_default) {
      const { error: clearErr } = await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', userId)
      if (clearErr) {
        setError(clearErr.message)
        setSaving(false)
        return
      }
    }

    if (draft.id) {
      const { data, error: upErr } = await supabase
        .from('addresses')
        .update(row)
        .eq('id', draft.id)
        .eq('user_id', userId)
        .select()
        .single()
      if (upErr) {
        setError(upErr.message)
        setSaving(false)
        return
      }
      setAddresses((prev) => prev.map((a) => (a.id === draft.id ? (data as AddressRow) : a)))
    } else {
      const { data, error: insErr } = await supabase.from('addresses').insert(row).select().single()
      if (insErr) {
        setError(insErr.message)
        setSaving(false)
        return
      }
      setAddresses((prev) => [data as AddressRow, ...prev])
    }
    setDraft(null)
    setSaving(false)
    router.refresh()
  }

  async function remove(id: string) {
    if (!confirm('Delete this address?')) return
    if (!isSupabaseBrowserConfigured()) {
      setError('Delete temporarily unavailable.')
      return
    }
    const supabase = createClient()
    const { error: delErr } = await supabase.from('addresses').delete().eq('id', id).eq('user_id', userId)
    if (delErr) {
      setError(delErr.message)
      return
    }
    setAddresses((prev) => prev.filter((a) => a.id !== id))
    router.refresh()
  }

  async function makeDefault(id: string) {
    if (!isSupabaseBrowserConfigured()) {
      setError('Update temporarily unavailable.')
      return
    }
    const supabase = createClient()
    const { error: clearErr } = await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', userId)
    if (clearErr) {
      setError(clearErr.message)
      return
    }
    const { error: upErr } = await supabase
      .from('addresses')
      .update({ is_default: true })
      .eq('id', id)
      .eq('user_id', userId)
    if (upErr) {
      setError(upErr.message)
      return
    }
    setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })))
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {error && <p className="error">{error}</p>}

      {addresses.length === 0 && !draft ? (
        <div className="premium-card px-6 py-12 text-center">
          <MapPin className="mx-auto h-10 w-10 text-earth-300" strokeWidth={1.25} />
          <p className="mt-4 font-medium text-earth-800">No saved addresses yet</p>
          <Button type="button" className="mt-6 rounded-xl" onClick={startNew}>
            <Plus className="mr-1 h-4 w-4" />
            Add address
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <article key={a.id} className="premium-card p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  {a.is_default && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-800">
                      <Star className="h-3 w-3 fill-current" /> Default
                    </span>
                  )}
                  <p className="mt-2 text-base font-semibold text-earth-900">
                    {a.label || 'Address'}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-earth-700">
                <span className="font-semibold text-earth-900">{a.full_name}</span>
                <br />
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ''}
                <br />
                {a.city}, {a.state} {a.postal_code}
                <br />
                {a.country}
                {a.phone && (
                  <>
                    <br />
                    <span className="text-earth-500">{a.phone}</span>
                  </>
                )}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => startEdit(a)}>
                  Edit
                </Button>
                {!a.is_default && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => void makeDefault(a.id)}>
                    Make default
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => void remove(a.id)}
                >
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {!draft && addresses.length > 0 && (
        <Button type="button" variant="outline" className="rounded-xl" onClick={startNew}>
          <Plus className="mr-1 h-4 w-4" />
          Add address
        </Button>
      )}

      {draft && (
        <form onSubmit={save} className="premium-card space-y-4 p-6 sm:p-8">
          <h3 className="text-base font-semibold text-earth-900">
            {draft.id ? 'Edit address' : 'New address'}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="form-label">Label (optional)</label>
              <Input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Full name</label>
              <Input
                value={draft.full_name}
                onChange={(e) => setDraft({ ...draft, full_name: e.target.value })}
                required
                autoComplete="name"
              />
            </div>
          </div>
          <div>
            <label className="form-label">Phone (optional)</label>
            <Input
              type="tel"
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              autoComplete="tel"
            />
          </div>
          <div>
            <label className="form-label">Street</label>
            <Input
              value={draft.line1}
              onChange={(e) => setDraft({ ...draft, line1: e.target.value })}
              required
              autoComplete="address-line1"
            />
          </div>
          <div>
            <label className="form-label">Apt / suite</label>
            <Input
              value={draft.line2}
              onChange={(e) => setDraft({ ...draft, line2: e.target.value })}
              autoComplete="address-line2"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="form-label">City</label>
              <Input
                value={draft.city}
                onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                required
                autoComplete="address-level2"
              />
            </div>
            <div>
              <label className="form-label">State</label>
              <Input
                value={draft.state}
                onChange={(e) => setDraft({ ...draft, state: e.target.value })}
                required
                autoComplete="address-level1"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="form-label">Country</label>
              <select
                value={draft.country}
                className="form-select"
                onChange={(e) => setDraft({ ...draft, country: e.target.value })}
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">ZIP</label>
              <Input
                value={draft.postal_code}
                onChange={(e) => setDraft({ ...draft, postal_code: e.target.value })}
                required
                autoComplete="postal-code"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-earth-600">
            <input
              type="checkbox"
              className="rounded border-earth-300"
              checked={draft.is_default}
              onChange={(e) => setDraft({ ...draft, is_default: e.target.checked })}
            />
            Set as default address
          </label>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" className="rounded-xl" disabled={saving}>
              {saving ? 'Saving…' : 'Save address'}
            </Button>
            <Button type="button" variant="ghost" onClick={cancel}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
