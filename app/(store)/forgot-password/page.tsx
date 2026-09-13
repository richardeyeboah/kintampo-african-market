'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useClientSearchParams } from '@/lib/hooks/use-client-search-params'
import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ForgotPasswordPage() {
  const { next } = useClientSearchParams()
  const emailRef = useRef<HTMLInputElement>(null)

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          next: next.startsWith('/') ? next : '/account',
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(data.error || 'Could not send email. Try again.')
        setLoading(false)
        return
      }
      setSent(true)
    } catch {
      setError('Could not send email. Try again.')
    }
    setLoading(false)
  }

  return (
    <AuthShell title="Forgot password" subtitle="We'll email you a link to reset your password.">
      {sent ? (
        <div role="status">
          <p className="success">If an account exists for that email, we sent a reset link.</p>
          <p className="muted mt-3">
            Check inbox and spam. Use the email you signed up with. Open the newest email, tap the
            link, then tap <strong>Continue</strong> on the next page.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="forgot-email" className="form-label">
              Email
            </label>
            <Input
              ref={emailRef}
              id="forgot-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="h-12 w-full rounded-xl" size="lg" disabled={loading}>
            {loading ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm">
        <Link href={`/login?next=${encodeURIComponent(next)}`}>← Back to sign in</Link>
      </p>
    </AuthShell>
  )
}
