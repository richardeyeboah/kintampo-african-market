'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient, isSupabaseBrowserConfigured } from '@/lib/supabase/client'
import { useClientSearchParams } from '@/lib/hooks/use-client-search-params'
import { isPasswordAcceptableForSignup } from '@/lib/auth/password-strength'
import { AuthShell } from '@/components/auth/AuthShell'
import { PasswordField } from '@/components/auth/PasswordField'
import { Button } from '@/components/ui/button'

export function ResetPasswordForm() {
  const router = useRouter()
  const { next } = useClientSearchParams()

  const [ready, setReady] = useState<'checking' | 'ready' | 'no-session'>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) {
      setReady('no-session')
      return
    }
    let cancelled = false
    const supabase = createClient()
    void (async () => {
      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      setReady(data.session ? 'ready' : 'no-session')
    })()
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || session) {
        setReady('ready')
      }
    })
    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('The two passwords do not match.')
      return
    }
    if (!isPasswordAcceptableForSignup(password)) {
      setError('Use a stronger password (8+ chars, upper, lower, number, special).')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message || 'Could not update password.')
      return
    }

    setDone(true)
    setTimeout(() => {
      router.push(next.startsWith('/') ? next : '/account')
      router.refresh()
    }, 1200)
  }

  return (
    <AuthShell title="New password" subtitle="Choose a strong password for your account.">
      {ready === 'checking' && <p role="status">Verifying your reset link…</p>}

      {ready === 'no-session' && (
        <div role="alert">
          <p className="error">This reset link is no longer valid (expired or already used).</p>
          <p className="mt-4">
            <Link href="/forgot-password">Send a new reset email</Link>
          </p>
        </div>
      )}

      {ready === 'ready' && !done && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordField
            label="New password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            disabled={loading}
            showStrengthMeter
          />
          <PasswordField
            label="Confirm password"
            name="confirm"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            disabled={loading}
          />
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="h-12 w-full rounded-xl" size="lg" disabled={loading}>
            {loading ? 'Saving…' : 'Update password'}
          </Button>
        </form>
      )}

      {done && (
        <p className="success" role="status">
          Password updated. Redirecting…
        </p>
      )}

      <p className="mt-6 text-center text-sm">
        <Link href="/login">← Back to sign in</Link>
      </p>
    </AuthShell>
  )
}
