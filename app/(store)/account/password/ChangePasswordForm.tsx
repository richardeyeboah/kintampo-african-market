'use client'

import { useState } from 'react'
import { createClient, isSupabaseBrowserConfigured } from '@/lib/supabase/client'
import { isPasswordAcceptableForSignup } from '@/lib/auth/password-strength'
import { PasswordField } from '@/components/auth/PasswordField'
import { Button } from '@/components/ui/button'

export function ChangePasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    if (!isSupabaseBrowserConfigured()) {
      setError('Password change is temporarily unavailable.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
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
      setError(updateError.message)
      return
    }
    setMessage('Password updated.')
    setPassword('')
    setConfirm('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PasswordField
        label="New password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        disabled={loading}
        showStrengthMeter
      />
      <PasswordField
        label="Confirm new password"
        name="confirm"
        value={confirm}
        onChange={setConfirm}
        autoComplete="new-password"
        disabled={loading}
      />
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
      <Button type="submit" className="h-11 rounded-xl" disabled={loading}>
        {loading ? 'Saving…' : 'Update password'}
      </Button>
    </form>
  )
}
