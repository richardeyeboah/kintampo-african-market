import { NextRequest, NextResponse } from 'next/server'
import { applyShippoTrackingUpdate, type ShippoTrackPayload } from '@/lib/shipping/apply-shippo-tracking'
import { isValidShippoWebhookToken } from '@/lib/shipping/shippo-webhook-auth'

export const runtime = 'nodejs'

/**
 * Shippo track_updated webhook.
 * Register URL: https://<site>/api/shippo/webhook?token=<SHIPPO_WEBHOOK_SECRET>
 * Shippo expects a 2xx within ~3s — keep this path lean.
 */
export async function POST(req: NextRequest) {
  const token =
    req.nextUrl.searchParams.get('token') ??
    req.headers.get('x-shippo-webhook-token')

  if (!isValidShippoWebhookToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: ShippoTrackPayload
  try {
    payload = (await req.json()) as ShippoTrackPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    const result = await applyShippoTrackingUpdate(payload)
    if (!result.ok) {
      console.error('[shippo/webhook] apply failed:', result.reason)
      return NextResponse.json({ error: result.reason ?? 'Update failed' }, { status: 500 })
    }
    return NextResponse.json({
      received: true,
      updated: Boolean(result.updated),
      orderId: result.orderId ?? null,
      toStatus: result.toStatus ?? null,
    })
  } catch (e) {
    console.error('[shippo/webhook] unexpected error:', e)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
