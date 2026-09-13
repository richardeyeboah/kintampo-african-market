'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient, isSupabaseBrowserConfigured } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function AccountSignOut() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function signOut() {
    if (!isSupabaseBrowserConfigured()) return
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={signOut} disabled={loading}>
      {loading ? 'Signing out…' : 'Sign out'}
    </Button>
  )
}
