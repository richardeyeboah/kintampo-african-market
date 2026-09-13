import { getPublicSiteUrl } from '@/lib/site-url'
import { getShippoWebhookToken } from '@/lib/shipping/shippo-webhook-auth'
import { isShippoConfigured, isShippoTestMode, shippoGet, shippoPost } from '@/lib/shipping/shippo-client'

type ShippoWebhookRow = {
  object_id?: string
  url?: string
  event?: string
  active?: boolean
  is_test?: boolean
}

export function getShippoTrackWebhookUrl(): string | null {
  const token = getShippoWebhookToken()
  if (!token) return null
  const base = getPublicSiteUrl()
  if (!base || base.includes('localhost')) return null
  return `${base}/api/shippo/webhook?token=${encodeURIComponent(token)}`
}

/**
 * Ensure a track_updated webhook points at this deployment.
 * Safe to call repeatedly — skips if an equivalent URL is already registered.
 */
export async function ensureShippoTrackWebhook(): Promise<{
  ok: boolean
  url?: string
  created?: boolean
  error?: string
}> {
  if (!isShippoConfigured()) {
    return { ok: false, error: 'Shippo is not configured.' }
  }

  const url = getShippoTrackWebhookUrl()
  if (!url) {
    return {
      ok: false,
      error: 'Public site URL is not set (needed to register the Shippo webhook).',
    }
  }

  if (url.length >= 200) {
    return { ok: false, error: 'Webhook URL is too long for Shippo (max 200 characters).' }
  }

  const isTest = isShippoTestMode()

  try {
    const listed = await shippoGet<{ results?: ShippoWebhookRow[] }>('/webhooks')
    const existing = (listed.results ?? []).find(
      (w) =>
        w.event === 'track_updated' &&
        w.url === url &&
        Boolean(w.is_test) === isTest &&
        w.active !== false
    )
    if (existing) {
      return { ok: true, url, created: false }
    }

    await shippoPost('/webhooks', {
      url,
      event: 'track_updated',
      is_test: isTest,
    })

    return { ok: true, url, created: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not register Shippo webhook.'
    console.error('[shippo] ensure webhook failed:', message)
    return { ok: false, url, error: message }
  }
}
