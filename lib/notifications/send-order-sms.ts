/**
 * Sends a single SMS to the merchant when a new order is paid. Uses Twilio's
 * REST API directly (no SDK) so we don't ship an extra dependency and so the
 * code works on either the Node or Edge runtimes.
 *
 * Required env (all four must be set, otherwise this is a quiet no-op):
 *   - TWILIO_ACCOUNT_SID         (starts with AC…)
 *   - TWILIO_AUTH_TOKEN          (from Twilio console)
 *   - TWILIO_FROM_NUMBER         (E.164, e.g. +16145550199)
 *   - MERCHANT_ALERT_PHONE       (E.164 destination — likely your own cell)
 *
 * Failures are logged and swallowed; the order is already saved by the caller,
 * we never want a flaky SMS to fail the whole webhook.
 */

import { formatOrderNumber } from '@/lib/orders/order-number'

const TWILIO_API_VERSION = '2010-04-01'

export type OrderSmsInput = {
  orderId: string
  orderNumber?: number | null
  customerName: string
  totalAmount: number
  city?: string | null
  shippingMethod?: string | null
  shortIdLength?: number
}

function trimEnv(name: string): string | undefined {
  const raw = process.env[name]
  return typeof raw === 'string' ? raw.trim() : undefined
}

function isEnabled(): boolean {
  return Boolean(
    trimEnv('TWILIO_ACCOUNT_SID') &&
      trimEnv('TWILIO_AUTH_TOKEN') &&
      trimEnv('TWILIO_FROM_NUMBER') &&
      trimEnv('MERCHANT_ALERT_PHONE'),
  )
}

function formatMoney(n: number): string {
  return `$${Number(n).toFixed(2)}`
}

export async function sendOrderSmsToMerchant(input: OrderSmsInput): Promise<void> {
  if (!isEnabled()) {
    return
  }

  const accountSid = trimEnv('TWILIO_ACCOUNT_SID')!
  const authToken = trimEnv('TWILIO_AUTH_TOKEN')!
  const fromNumber = trimEnv('TWILIO_FROM_NUMBER')!
  const toNumber = trimEnv('MERCHANT_ALERT_PHONE')!

  const shortIdLen = input.shortIdLength ?? 8
  const friendly = formatOrderNumber(input.orderNumber) || `#${input.orderId.slice(0, shortIdLen)}`
  const isPickup = (input.shippingMethod ?? '').trim().toLowerCase() === 'pickup'
  const tag = isPickup ? '[PICKUP] ' : ''
  const fulfillmentClause = isPickup
    ? ' — prep for pickup'
    : input.city
      ? ` to ${input.city}`
      : ''
  const body = `${tag}[Kintampo] New order ${friendly} — ${formatMoney(input.totalAmount)} from ${input.customerName}${fulfillmentClause}. Open admin to confirm.`

  const url = `https://api.twilio.com/${TWILIO_API_VERSION}/Accounts/${encodeURIComponent(accountSid)}/Messages.json`
  const params = new URLSearchParams({
    To: toNumber,
    From: fromNumber,
    Body: body,
  })

  // Basic auth header — Edge-safe (uses btoa, not Buffer).
  const credentials = `${accountSid}:${authToken}`
  const basicAuth = typeof btoa === 'function' ? btoa(credentials) : Buffer.from(credentials).toString('base64')

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error('[sms] Twilio error', res.status, detail.slice(0, 400))
    }
  } catch (err) {
    console.error('[sms] Twilio request failed:', err)
  }
}
