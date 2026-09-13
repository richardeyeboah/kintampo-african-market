'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient, isSupabaseBrowserConfigured } from '@/lib/supabase/client'
import { AuthShell } from '@/components/auth/AuthShell'
import { getAuthSiteOrigin } from '@/lib/site-url-client'
import { Button } from '@/components/ui/button'

export default function VerifyEmailPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [verified, setVerified] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) {
      setReady(true)
      return
    }
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setSignedIn(!!user)
      setVerified(!!user?.email_confirmed_at)
      setEmail(user?.email ?? null)
      setReady(true)
      if (user?.email_confirmed_at) router.replace('/account')
    })
  }, [router])

  async function resend() {
    if (!email) return
    setStatus('sending')
    const supabase = createClient()
    const origin = getAuthSiteOrigin()
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${origin}/auth/callback?next=/account` },
    })
    setStatus(error ? 'error' : 'sent')
  }

  if (!ready) {
    return (
      <AuthShell title="Verify email" subtitle="Loading…">
        <p>Loading…</p>
      </AuthShell>
    )
  }

  if (!signedIn) {
    return (
      <AuthShell title="Sign in required" subtitle="Log in to resend your verification email.">
        <Link href="/login?next=/verify-email" className="no-underline">
          <Button className="h-12 w-full rounded-xl" size="lg">
            Sign in
          </Button>
        </Link>
      </AuthShell>
    )
  }

  if (verified) return null

  return (
    <AuthShell title="Verify your email" subtitle={`We sent a link to ${email ?? 'your inbox'}.`}>
      <p className="text-sm text-earth-600">
        Open the link in your email to activate your account. Check spam if you don&apos;t see it.
      </p>
      <Button
        type="button"
        className="mt-6 h-12 w-full rounded-xl"
        size="lg"
        onClick={() => void resend()}
        disabled={status === 'sending'}
      >
        {status === 'sending' ? 'Sending…' : 'Resend verification email'}
      </Button>
      {status === 'sent' && (
        <p className="success mt-4" role="status">
          If an account exists, we sent a new link. Check spam.
        </p>
      )}
      {status === 'error' && (
        <p className="error mt-4" role="alert">
          Could not send right now.
        </p>
      )}
      <p className="mt-6 text-center text-sm">
        <Link href="/account">← Back to account</Link>
      </p>
    </AuthShell>
  )
}
