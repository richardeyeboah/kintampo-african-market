'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { createClient, isSupabaseBrowserConfigured } from '@/lib/supabase/client'
import { isPasswordAcceptableForSignup } from '@/lib/auth/password-strength'
import { AuthShell } from '@/components/auth/AuthShell'
import { PasswordField } from '@/components/auth/PasswordField'
import { Button } from '@/components/ui/button'

type EmailOtpType = 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email'

/**
 * Email scanners prefetch links and burn one-time tokens.
 * We only verify on button click, then set the new password on this same page
 * (no redirect race that drops the recovery session).
 */
export default function AuthConfirmPage() {
  const [ready, setReady] = useState(false)
  const [tokenHash, setTokenHash] = useState('')
  const [type, setType] = useState('')
  const [code, setCode] = useState('')
  const [next, setNext] = useState('/account')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'confirm' | 'password' | 'done'>('confirm')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    setTokenHash(sp.get('token_hash') ?? '')
    setType(sp.get('type') ?? '')
    setCode(sp.get('code') ?? '')
    const nextRaw = sp.get('next') ?? '/account'
    // Prefer account after recovery; allow /reset-password legacy next values.
    if (nextRaw.startsWith('/reset-password')) setNext('/account')
    else setNext(nextRaw.startsWith('/') ? nextRaw : '/account')
    setReady(true)
  }, [])

  const isRecovery = type === 'recovery' || (!type && Boolean(tokenHash || code))

  const actionLabel = useMemo(() => {
    if (isRecovery) return 'Continue to reset password'
    if (type === 'signup' || type === 'email') return 'Confirm email and continue'
    return 'Continue'
  }, [isRecovery, type])

  async function establishSession() {
    const supabase = createClient()

    if (tokenHash && type) {
      const { error: otpError } = await supabase.auth.verifyOtp({
        type: type as EmailOtpType,
        token_hash: tokenHash,
      })
      if (otpError) throw otpError
      return
    }

    if (code) {
      const { error: codeError } = await supabase.auth.exchangeCodeForSession(code)
      if (codeError) throw codeError
      return
    }

    throw new Error('Missing reset details. Request a new password reset email.')
  }

  async function handleContinue() {
    if (!isSupabaseBrowserConfigured()) {
      setError('Sign-in is temporarily unavailable.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await establishSession()
      if (isRecovery) {
        setStep('password')
      } else {
        window.location.assign(next)
        return
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not verify link.'
      setError(
        /expired|invalid|used/i.test(message)
          ? 'This link is invalid or was already used. Request a new password reset email.'
          : message
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
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
    setStep('done')
    setTimeout(() => {
      window.location.assign(next.startsWith('/') ? next : '/account')
    }, 1000)
  }

  const hasParams = Boolean((tokenHash && type) || code)

  if (!ready) {
    return (
      <AuthShell title="Reset password" subtitle="Loading…">
        <p className="muted text-sm">One moment…</p>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={isRecovery ? 'Reset password' : 'Confirm'}
      subtitle={
        step === 'password'
          ? 'Choose a strong new password.'
          : 'Continue to confirm this link.'
      }
    >
      {!hasParams ? (
        <div className="space-y-4">
          <p className="error" role="alert">
            This confirmation link is incomplete or expired.
          </p>
          <Link href="/forgot-password" className="inline-flex min-h-11 items-center font-semibold">
            Request a new reset email →
          </Link>
        </div>
      ) : step === 'confirm' ? (
        <div className="space-y-4">
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <Button
            type="button"
            className="h-12 w-full rounded-xl"
            size="lg"
            disabled={loading}
            onClick={() => void handleContinue()}
          >
            {loading ? 'Working…' : actionLabel}
          </Button>
          {error && (
            <p className="text-center text-sm">
              <Link href="/forgot-password" className="font-semibold">
                Send a new reset email
              </Link>
            </p>
          )}
        </div>
      ) : step === 'password' ? (
        <form onSubmit={handleUpdatePassword} className="space-y-4">
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
            value={confirmPassword}
            onChange={setConfirmPassword}
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
      ) : (
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
