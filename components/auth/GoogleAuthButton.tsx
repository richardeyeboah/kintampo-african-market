'use client'

import { useState } from 'react'
import { createClient, isSupabaseBrowserConfigured } from '@/lib/supabase/client'
import { getAuthSiteOrigin } from '@/lib/site-url-client'
import { Button } from '@/components/ui/button'

function googleAuthEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === '1'
}

export function GoogleAuthButton({
  next = '/account',
  label = 'Continue with Google',
}: {
  next?: string
  label?: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!googleAuthEnabled()) return null

  async function startGoogle() {
    if (!isSupabaseBrowserConfigured()) {
      setError('Sign-in is temporarily unavailable.')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const origin = getAuthSiteOrigin()
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (oauthError) {
      setError(oauthError.message)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative py-1 text-center text-xs font-medium uppercase tracking-[0.14em] text-earth-400">
        <span className="relative z-10 bg-white px-3">Or</span>
        <span className="absolute inset-x-0 top-1/2 h-px bg-earth-200" aria-hidden />
      </div>
      <Button
        type="button"
        variant="outline"
        className="h-12 w-full rounded-xl"
        size="lg"
        disabled={loading}
        onClick={startGoogle}
      >
        {loading ? 'Redirecting…' : label}
      </Button>
      {error && (
        <p className="error text-center" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
