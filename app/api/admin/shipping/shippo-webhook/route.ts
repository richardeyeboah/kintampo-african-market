import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/require-admin-api'
import { ensureShippoTrackWebhook, getShippoTrackWebhookUrl } from '@/lib/shipping/shippo-webhooks'
import { isShippoConfigured, isShippoTestMode } from '@/lib/shipping/shippo-client'

export const runtime = 'nodejs'

export async function GET() {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  return NextResponse.json({
    configured: isShippoConfigured(),
    testMode: isShippoTestMode(),
    webhookUrl: getShippoTrackWebhookUrl(),
  })
}

export async function POST() {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const result = await ensureShippoTrackWebhook()
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Could not register webhook.' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    created: Boolean(result.created),
    url: result.url,
    message: result.created
      ? 'Tracking updates connected.'
      : 'Tracking updates already connected.',
  })
}
