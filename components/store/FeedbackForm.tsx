'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getSupportEmail } from '@/lib/constants/store'
import { StorePhoneLinks } from '@/components/store/StorePhoneLinks'

const CATEGORIES = [
  { value: 'suggestion', label: 'Site suggestion' },
  { value: 'bug', label: 'Bug or broken page' },
  { value: 'product', label: 'Product request' },
  { value: 'other', label: 'Other' },
] as const

export function FeedbackForm() {
  const pathname = usePathname()
  const supportEmail = getSupportEmail()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [category, setCategory] = useState<string>('suggestion')
  const [message, setMessage] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          category,
          message,
          pageUrl: typeof window !== 'undefined' ? `${window.location.origin}${pathname}` : '',
          website: honeypot,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Something went wrong. Try again.')
        setStatus('error')
        return
      }
      setStatus('success')
      setMessage('')
    } catch {
      setErrorMsg('Network error. Check your connection and try again.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-xl border border-brand-200 bg-brand-50 px-6 py-8 text-center">
        <p className="text-base font-semibold text-earth-900">Thanks — we got your feedback.</p>
        <p className="mt-2 text-sm text-earth-600">
          We read every message. For urgent order issues, call the store or email{' '}
          <a href={`mailto:${supportEmail}`} className="font-medium text-brand-700 no-underline">
            {supportEmail}
          </a>
          .
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-5"
          onClick={() => setStatus('idle')}
        >
          Send another
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-earth-600">
        Tell us what to fix or add on the website. Orders and stock questions: call{' '}
        <StorePhoneLinks
          linkClassName="font-medium text-brand-700 no-underline"
          separator=" or "
        />{' '}
        or email{' '}
        <a href={`mailto:${supportEmail}`} className="font-medium text-brand-700 no-underline">
          {supportEmail}
        </a>
        .
      </p>

      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label htmlFor="feedback-website">Website</label>
        <input
          id="feedback-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="feedback-name" className="form-label">
            Name <span className="font-normal text-earth-400">(optional)</span>
          </label>
          <Input
            id="feedback-name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="feedback-email" className="form-label">
            Email
          </label>
          <Input
            id="feedback-email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
      </div>

      <div>
        <label htmlFor="feedback-category" className="form-label">
          Category
        </label>
        <select
          id="feedback-category"
          name="category"
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="form-select"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="feedback-message" className="form-label">
          Your feedback
        </label>
        <textarea
          id="feedback-message"
          name="message"
          required
          rows={6}
          maxLength={2000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Your feedback"
          className="form-input min-h-[140px] resize-y"
        />
        <p className="mt-1 text-xs text-earth-500">{message.length}/2000</p>
      </div>

      {errorMsg && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {errorMsg}
        </p>
      )}

      <Button type="submit" size="lg" className="h-11 w-full sm:w-auto" disabled={status === 'loading'}>
        {status === 'loading' ? 'Sending…' : 'Send feedback'}
      </Button>
    </form>
  )
}
