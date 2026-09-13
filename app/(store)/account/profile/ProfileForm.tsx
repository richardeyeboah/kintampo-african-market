'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient, isSupabaseBrowserConfigured } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Props = {
  userId: string
  initial: {
    full_name: string
    phone: string
    marketing_opt_in: boolean
  }
}

export function ProfileForm({ userId, initial }: Props) {
  const router = useRouter()
  const [fullName, setFullName] = useState(initial.full_name)
  const [phone, setPhone] = useState(initial.phone)
  const [marketingOptIn, setMarketingOptIn] = useState(initial.marketing_opt_in)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isSupabaseBrowserConfigured()) {
      setError('Saving is temporarily unavailable.')
      return
    }
    setLoading(true)
    setError('')
    setMessage('')

    const supabase = createClient()
    const { error: upsertError } = await supabase.from('profiles').upsert({
      id: userId,
      full_name: fullName.trim() || null,
      phone: phone.trim() || null,
      marketing_opt_in: marketingOptIn,
    })

    setLoading(false)
    if (upsertError) {
      setError(upsertError.message)
      return
    }

    await supabase.auth.updateUser({
      data: {
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        marketing_opt_in: marketingOptIn,
      },
    })

    setMessage('Profile saved.')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="profile-name" className="form-label">
          Full name
        </label>
        <Input
          id="profile-name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          autoComplete="name"
        />
      </div>
      <div>
        <label htmlFor="profile-phone" className="form-label">
          Phone
        </label>
        <Input
          id="profile-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
        />
      </div>
      <label className="flex items-start gap-2 text-sm text-earth-600">
        <input
          type="checkbox"
          className="mt-0.5 rounded border-earth-300"
          checked={marketingOptIn}
          onChange={(e) => setMarketingOptIn(e.target.checked)}
        />
        Email me deals and restock alerts
      </label>

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      <Button type="submit" className="h-11 rounded-xl" disabled={loading}>
        {loading ? 'Saving…' : 'Save profile'}
      </Button>
    </form>
  )
}
