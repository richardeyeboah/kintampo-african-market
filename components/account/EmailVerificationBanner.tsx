'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Mail } from 'lucide-react'
import { createClient, isSupabaseBrowserConfigured } from '@/lib/supabase/client'
import { getAuthSiteOrigin } from '@/lib/site-url-client'
import { Button } from '@/components/ui/button'

export function EmailVerificationBanner({ email }: { email: string | null | undefined }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function resend() {
    if (!email || !isSupabaseBrowserConfigured()) return
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

  return (
    <div
      role="region"
      aria-label="Email verification"
      className="premium-card flex flex-col gap-4 border-accent-200/80 bg-accent-50/50 p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex gap-3">
        <Mail className="mt-0.5 h-5 w-5 shrink-0 text-accent-600" aria-hidden />
        <div>
          <p className="font-semibold text-earth-950">Verify your email</p>
          <p className="mt-1 text-sm text-earth-600">
            Confirm your address so we can reach you about orders.{' '}
            <Link href="/verify-email" className="font-semibold">
              More options
            </Link>
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-1 sm:items-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl border-accent-300 bg-white"
          onClick={() => void resend()}
          disabled={status === 'sending' || !email}
        >
          {status === 'sending' ? 'Sending…' : 'Resend email'}
        </Button>
        {status === 'sent' && <span className="text-xs text-brand-700">Sent — check inbox</span>}
        {status === 'error' && <span className="text-xs text-red-700">Could not send</span>}
      </div>
    </div>
  )
}
