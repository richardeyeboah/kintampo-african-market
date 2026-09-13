'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient, isSupabaseBrowserConfigured } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function NavbarAuth({
  className,
  onNavigate,
}: {
  className?: string
  onNavigate?: () => void
}) {
  const [ready, setReady] = useState(false)
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) {
      setReady(true)
      return
    }
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSignedIn(!!session?.user)
      setReady(true)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session?.user)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (!ready) {
    return <span className={cn('text-sm text-stone-400', className)}>…</span>
  }

  if (signedIn) return null

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Link href="/login" className="no-underline" onClick={onNavigate}>
        <Button variant="ghost" size="sm">
          Sign in
        </Button>
      </Link>
      <Link href="/signup" className="no-underline" onClick={onNavigate}>
        <Button variant="default" size="sm">
          Sign up
        </Button>
      </Link>
    </div>
  )
}
