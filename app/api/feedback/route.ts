import { NextRequest, NextResponse } from 'next/server'
import { sendFeedbackEmail } from '@/lib/email/send-feedback-email'
import { assertSameOrigin } from '@/lib/security/same-origin'
import {
  isFeedbackAllowed,
  recordFeedbackAttempt,
} from '@/lib/security/feedback-rate-limit'

export const runtime = 'nodejs'

const CATEGORIES = new Set(['suggestion', 'bug', 'product', 'other'])

function clientKey(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const realIp = req.headers.get('x-real-ip')?.trim()
  return forwarded || realIp || 'unknown'
}

export async function POST(req: NextRequest) {
  const originCheck = assertSameOrigin(req)
  if (!originCheck.ok) return originCheck.response

  const key = clientKey(req)
  const limit = isFeedbackAllowed(key)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many submissions. Try again in ${limit.retryAfterSecs} seconds.` },
      { status: 429 }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  if (typeof body.website === 'string' && body.website.trim()) {
    return NextResponse.json({ ok: true })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : ''
  const category =
    typeof body.category === 'string' && CATEGORIES.has(body.category) ? body.category : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  const pageUrl =
    typeof body.pageUrl === 'string' ? body.pageUrl.trim().slice(0, 500) : undefined

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
  }
  if (!category) {
    return NextResponse.json({ error: 'Choose a category.' }, { status: 400 })
  }
  if (message.length < 10) {
    return NextResponse.json({ error: 'Message must be at least 10 characters.' }, { status: 400 })
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: 'Message is too long (max 2000 characters).' }, { status: 400 })
  }

  recordFeedbackAttempt(key)

  const sent = await sendFeedbackEmail({ name, email, category, message, pageUrl })
  if (!sent) {
    return NextResponse.json(
      {
        error:
          'Feedback could not be sent right now. Email the store directly or try again later.',
      },
      { status: 503 }
    )
  }

  return NextResponse.json({ ok: true })
}
