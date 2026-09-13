'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

type Props = {
  configured: boolean
  testMode: boolean
  webhookUrl: string | null
}

export function ShippoTrackingConnect({ configured, testMode, webhookUrl }: Props) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  if (!configured) return null

  async function connect() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch('/api/admin/shipping/shippo-webhook', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Could not connect tracking updates.')
        return
      }
      setMessage(typeof data.message === 'string' ? data.message : 'Connected.')
    } catch {
      setError('Could not connect tracking updates.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="admin-card">
      <h2 className="admin-section-title">Automatic delivery updates</h2>
      <p className="mt-2 text-sm text-earth-700">
        When USPS marks a package delivered (via Shippo), the order status updates and the customer
        gets an email.
        {testMode ? ' Currently using Shippo test mode.' : ''}
      </p>
      {webhookUrl ? (
        <p className="mt-2 break-all font-mono text-xs text-earth-500">{webhookUrl}</p>
      ) : (
        <p className="mt-2 text-sm text-amber-800">
          Set the public site URL on this deployment before connecting.
        </p>
      )}
      {error ? (
        <p className="mt-3 text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {message ? <p className="mt-3 text-sm font-medium text-emerald-700">{message}</p> : null}
      <Button
        type="button"
        className="mt-4 h-11"
        disabled={busy || !webhookUrl}
        onClick={() => void connect()}
      >
        {busy ? 'Connecting…' : 'Connect tracking updates'}
      </Button>
    </section>
  )
}
