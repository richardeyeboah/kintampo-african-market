import nodemailer from 'nodemailer'
import postmark from 'postmark'
import type { AuthoritativeOrderItem } from '@/lib/order-pricing'
import {
  isPickupShippingMethod,
  orderStatusLabel,
  type OrderStatus,
} from '@/lib/order-status'
import { STORE } from '@/lib/constants/store'
import { PICKUP_HOLD_HOURS } from '@/lib/orders/pickup-hold'
import { PAYMENT_LABEL, normalizePaymentMethod } from '@/lib/payment-methods'
import { getPublicSiteUrl } from '@/lib/site-url'
import { SHIPPING_METHOD_LABEL, type ShippingMethod } from '@/lib/shipping'
import { formatOrderNumber } from '@/lib/orders/order-number'
import { isPlaceholderCustomerEmail } from '@/lib/orders/order-source'

const STORE_NAME = 'Kintampo African Market'

export type OrderRowForEmail = {
  id: string
  order_number?: number | null
  customer_name: string
  customer_email: string
  customer_phone: string | null
  address_line: string
  city: string
  state: string | null
  country: string
  postal_code: string | null
  subtotal_amount: number
  shipping_fee: number
  tax_amount?: number
  total_amount: number
  shipping_method: string | null
  payment_method: string | null
  pickup_contact_name?: string | null
}

function orderRefLabel(order: { id: string; order_number?: number | null }): string {
  return formatOrderNumber(order.order_number) || `#${order.id.slice(0, 8)}`
}

function trackQueryValue(order: { id: string; order_number?: number | null }): string {
  return formatOrderNumber(order.order_number) || order.id
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function money(n: number): string {
  return `$${Number(n).toFixed(2)}`
}

function itemsTableHtml(items: AuthoritativeOrderItem[]): string {
  const rows = items
    .map(
      (line) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(line.product_name)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${line.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${money(line.product_price)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${money(line.subtotal)}</td>
    </tr>`
    )
    .join('')
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px;">
    <thead>
      <tr style="background:#0f3d2e;color:#fff;">
        <th style="padding:10px 12px;text-align:left;">Item</th>
        <th style="padding:10px 12px;text-align:center;">Qty</th>
        <th style="padding:10px 12px;text-align:right;">Price</th>
        <th style="padding:10px 12px;text-align:right;">Subtotal</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`
}

function itemsPlainText(items: AuthoritativeOrderItem[]): string {
  return items
    .map(
      (line) =>
        `${line.product_name}  x${line.quantity}  @ ${money(line.product_price)}  = ${money(line.subtotal)}`
    )
    .join('\n')
}

function receiptHtml(order: OrderRowForEmail, items: AuthoritativeOrderItem[]): string {
  const pay =
    PAYMENT_LABEL[normalizePaymentMethod(order.payment_method)] ?? order.payment_method ?? '—'
  const ship = SHIPPING_METHOD_LABEL[(order.shipping_method as ShippingMethod) ?? 'standard'] ?? order.shipping_method ?? '—'
  const base = getPublicSiteUrl()
  const trackPath = `/track-order?id=${encodeURIComponent(trackQueryValue(order))}`
  const trackUrl = base ? `${base}${trackPath}` : trackPath
  const orderLabel = orderRefLabel(order)
  const isPickup = isPickupShippingMethod(order.shipping_method)

  const fulfillmentBlock = isPickup
    ? `
    <p style="margin:20px 0 8px;font-size:13px;color:#444;"><strong>Store pickup</strong></p>
    <p style="margin:0;font-size:14px;color:#333;">
      ${escapeHtml(STORE.name)}<br/>
      ${escapeHtml(STORE.address)}<br/>
      ${escapeHtml(STORE.hours)}
    </p>
    ${order.pickup_contact_name ? `<p style="margin:8px 0 0;font-size:14px;color:#333;"><strong>Collected by:</strong> ${escapeHtml(order.pickup_contact_name)}</p>` : ''}
    <p style="margin:12px 0 0;padding:12px;background:#f4f8f6;border-radius:8px;font-size:13px;color:#0f3d2e;">
      We'll email you when it's ready. Sending an Uber, DoorDash, or a friend? Have them show order <strong>${escapeHtml(orderLabel)}</strong> at the counter.
    </p>`
    : `
    <p style="margin:20px 0 8px;font-size:13px;color:#444;"><strong>Ship to</strong></p>
    <p style="margin:0;font-size:14px;color:#333;">
      ${escapeHtml(order.address_line)}<br/>
      ${escapeHtml(order.city)}${order.state ? `, ${escapeHtml(order.state)}` : ''} ${escapeHtml(order.postal_code ?? '')}<br/>
      ${escapeHtml(order.country)}
    </p>`

  return `
<!DOCTYPE html>
<html><body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#111;background:#f9f9f9;margin:0;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #e5e5e5;">
    <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#0f3d2e;font-weight:600;">${escapeHtml(STORE_NAME)}</p>
    <h1 style="margin:0 0 12px;font-size:22px;">Thanks for your order</h1>
    <p style="margin:0 0 20px;color:#444;font-size:15px;">Hi ${escapeHtml(order.customer_name)}, we received your order and will send updates to this email.</p>
    <p style="margin:0 0 16px;font-size:13px;color:#666;"><strong>Order number:</strong> ${escapeHtml(orderLabel)}</p>
    ${itemsTableHtml(items)}
    <table role="presentation" style="width:100%;margin-top:16px;font-size:14px;">
      <tr><td style="padding:4px 0;">Subtotal</td><td style="text-align:right;">${money(order.subtotal_amount)}</td></tr>
      <tr><td style="padding:4px 0;">Shipping</td><td style="text-align:right;">${money(order.shipping_fee)}</td></tr>
      ${(order.tax_amount ?? 0) > 0 ? `<tr><td style="padding:4px 0;">Sales tax</td><td style="text-align:right;">${money(order.tax_amount!)}</td></tr>` : ''}
      <tr><td style="padding:12px 0 4px;font-weight:700;border-top:1px solid #eee;">Total</td><td style="text-align:right;padding:12px 0 4px;font-weight:700;border-top:1px solid #eee;">${money(order.total_amount)}</td></tr>
    </table>
    ${fulfillmentBlock}
    <p style="margin:16px 0 0;font-size:13px;color:#444;"><strong>Payment:</strong> ${escapeHtml(pay)} &nbsp;·&nbsp; <strong>${isPickup ? 'Fulfillment' : 'Shipping'}:</strong> ${escapeHtml(ship)}</p>
    <p style="margin:24px 0 0;">
      <a href="${trackUrl}" style="display:inline-block;background:#0f3d2e;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:600;">Track your order</a>
    </p>
  </div>
  <p style="max-width:560px;margin:16px auto 0;text-align:center;font-size:12px;color:#888;">This message was sent because you placed an order at ${escapeHtml(STORE_NAME)}.</p>
</body></html>`
}

function receiptText(order: OrderRowForEmail, items: AuthoritativeOrderItem[]): string {
  const pay = PAYMENT_LABEL[normalizePaymentMethod(order.payment_method)] ?? String(order.payment_method)
  const ship = SHIPPING_METHOD_LABEL[(order.shipping_method as ShippingMethod) ?? 'standard'] ?? String(order.shipping_method)
  const isPickup = isPickupShippingMethod(order.shipping_method)
  const orderLabel = orderRefLabel(order)

  const fulfillmentLines = isPickup
    ? [
        `Store pickup:`,
        STORE.name,
        STORE.address,
        STORE.hours,
        ...(order.pickup_contact_name ? [`Collected by: ${order.pickup_contact_name}`] : []),
        ``,
        `We'll email you when it's ready. Sending an Uber, DoorDash, or a friend?`,
        `Have them show order ${orderLabel} at the counter.`,
      ]
    : [
        `Ship to:`,
        `${order.address_line}`,
        `${order.city}${order.state ? `, ${order.state}` : ''} ${order.postal_code ?? ''}`,
        `${order.country}`,
      ]

  return [
    `${STORE_NAME} — Order confirmation`,
    ``,
    `Hi ${order.customer_name},`,
    ``,
    `Order number: ${orderLabel}`,
    ``,
    itemsPlainText(items),
    ``,
    `Subtotal: ${money(order.subtotal_amount)}`,
    `Shipping: ${money(order.shipping_fee)}`,
    ...((order.tax_amount ?? 0) > 0 ? [`Sales tax: ${money(order.tax_amount!)}`] : []),
    `Total: ${money(order.total_amount)}`,
    ``,
    ...fulfillmentLines,
    ``,
    `Payment: ${pay}`,
    `${isPickup ? 'Fulfillment' : 'Shipping'}: ${ship}`,
    ``,
    `Track: ${getPublicSiteUrl()}/track-order?id=${trackQueryValue(order)}`,
  ].join('\n')
}

function merchantHtml(order: OrderRowForEmail, items: AuthoritativeOrderItem[]): string {
  const base = getPublicSiteUrl()
  const adminPath = `/admin/orders/${order.id}`
  const adminUrl = base ? `${base}${adminPath}` : adminPath
  const isPickup = isPickupShippingMethod(order.shipping_method)
  const fulfillmentBadge = isPickup
    ? `<p style="margin:0 0 12px;display:inline-block;background:#0f3d2e;color:#fff;border-radius:6px;padding:4px 10px;font-size:12px;font-weight:700;">STORE PICKUP${order.pickup_contact_name ? ` — ${escapeHtml(order.pickup_contact_name)}` : ''}</p>`
    : ''

  return `
<!DOCTYPE html>
<html><body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#111;background:#f9f9f9;margin:0;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #e5e5e5;">
    <h1 style="margin:0 0 8px;font-size:20px;color:#0f3d2e;">New order ${escapeHtml(orderRefLabel(order))}</h1>
    ${fulfillmentBadge}
    <p style="margin:0 0 16px;font-size:14px;color:#444;"><strong>${escapeHtml(order.customer_name)}</strong> placed an order for <strong>${money(order.total_amount)}</strong>.</p>
    <p style="margin:0 0 8px;font-size:13px;"><strong>Order:</strong> ${escapeHtml(orderRefLabel(order))} <span style="color:#999;">(${escapeHtml(order.id)})</span></p>
    <p style="margin:0 0 8px;font-size:13px;"><strong>Email:</strong> ${escapeHtml(order.customer_email)}</p>
    <p style="margin:0 0 16px;font-size:13px;"><strong>Phone:</strong> ${escapeHtml(order.customer_phone ?? '—')}</p>
    ${itemsTableHtml(items)}
    <p style="margin:20px 0 0;">
      <a href="${adminUrl.startsWith('http') ? adminUrl : '#'}" style="display:inline-block;background:#0f3d2e;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:600;">Open in admin</a>
    </p>
  </div>
</body></html>`
}

function merchantText(order: OrderRowForEmail, items: AuthoritativeOrderItem[]): string {
  const isPickup = isPickupShippingMethod(order.shipping_method)
  return [
    `New order ${orderRefLabel(order)} — ${STORE_NAME}`,
    ...(isPickup
      ? [`*** STORE PICKUP${order.pickup_contact_name ? ` — ${order.pickup_contact_name}` : ''} ***`]
      : []),
    `Total: ${money(order.total_amount)}`,
    `Customer: ${order.customer_name}`,
    `Email: ${order.customer_email}`,
    `Phone: ${order.customer_phone ?? '—'}`,
    ``,
    itemsPlainText(items),
    ``,
    `Admin: ${getPublicSiteUrl()}/admin/orders/${order.id}`,
  ].join('\n')
}

type EmailPayload = {
  to: string
  subject: string
  html: string
  text: string
}

/**
 * Pick an email transport based on what's configured:
 *
 *   1. Gmail SMTP — if GMAIL_USER + GMAIL_APP_PASSWORD are set.
 *      Get an App Password at https://myaccount.google.com/apppasswords
 *      (2-Step Verification must be on). This is the simplest path: no DNS,
 *      no domain verification, just a free Gmail address.
 *
 *   2. Generic SMTP — if SMTP_HOST + SMTP_USER + SMTP_PASS are set.
 *      Useful for any other SMTP provider (SendGrid SMTP, Mailgun SMTP, etc.).
 *
 *   3. Postmark HTTP API — if POSTMARK_SERVER_TOKEN is set.
 *      Production-grade transactional email; requires verified sender or domain.
 *
 *   4. None — log a warning and skip emails (order is still persisted).
 */
type Sender = (payload: EmailPayload) => Promise<void>

function pickSender(): { sender: Sender; from: string; label: string } | null {
  const explicitFrom = process.env.EMAIL_FROM?.trim()

  const gmailUser = process.env.GMAIL_USER?.trim()
  const gmailPass = process.env.GMAIL_APP_PASSWORD?.trim().replace(/\s+/g, '')
  if (gmailUser && gmailPass) {
    const from = explicitFrom || `${STORE_NAME} <${gmailUser}>`
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    })
    const sender: Sender = async ({ to, subject, html, text }) => {
      await transporter.sendMail({ from, to, subject, html, text })
    }
    return { sender, from, label: 'gmail-smtp' }
  }

  const smtpHost = process.env.SMTP_HOST?.trim()
  const smtpUser = process.env.SMTP_USER?.trim()
  const smtpPass = process.env.SMTP_PASS?.trim()
  if (smtpHost && smtpUser && smtpPass) {
    const from = explicitFrom || smtpUser
    const port = Number(process.env.SMTP_PORT?.trim() || '587')
    const secure = process.env.SMTP_SECURE?.trim() === 'true' || port === 465
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port,
      secure,
      auth: { user: smtpUser, pass: smtpPass },
    })
    const sender: Sender = async ({ to, subject, html, text }) => {
      await transporter.sendMail({ from, to, subject, html, text })
    }
    return { sender, from, label: `smtp:${smtpHost}` }
  }

  const postmarkToken = process.env.POSTMARK_SERVER_TOKEN?.trim()
  if (postmarkToken && explicitFrom) {
    const client = new postmark.ServerClient(postmarkToken)
    const stream = process.env.POSTMARK_MESSAGE_STREAM?.trim() || 'outbound'
    const sender: Sender = async ({ to, subject, html, text }) => {
      await client.sendEmail({
        From: explicitFrom,
        To: to,
        Subject: subject,
        HtmlBody: html,
        TextBody: text,
        MessageStream: stream,
      })
    }
    return { sender, from: explicitFrom, label: 'postmark' }
  }

  return null
}

/** Send a one-off transactional email using the same transport as order alerts. */
export async function sendTransactionalEmail(payload: EmailPayload): Promise<boolean> {
  const picked = pickSender()
  if (!picked) {
    console.warn('[email] No email transport configured — cannot send message.')
    return false
  }
  try {
    await picked.sender(payload)
    return true
  } catch (error) {
    console.error(`[email:${picked.label}] Send failed:`, error)
    return false
  }
}

/**
 * Sends (1) a receipt to the customer, (2) an alert to the store inbox, and
 * (3) optionally a tiny email to a carrier SMS gateway (e.g.
 * `6142904260@vtext.com`) so the merchant's phone buzzes with a text — all
 * without paying for Twilio.
 *
 * Safe to call after the order is persisted; failures are logged and do not throw.
 */
export async function sendOrderEmails(order: OrderRowForEmail, items: AuthoritativeOrderItem[]): Promise<void> {
  const picked = pickSender()
  if (!picked) {
    console.warn('[email] No email transport configured — set GMAIL_USER + GMAIL_APP_PASSWORD (easiest), SMTP_*, or POSTMARK_SERVER_TOKEN + EMAIL_FROM. Skipping.')
    return
  }
  const { sender, label } = picked
  const orderLabel = orderRefLabel(order)

  if (!isPlaceholderCustomerEmail(order.customer_email)) {
    try {
      await sender({
        to: order.customer_email,
        subject: `Your order ${orderLabel} — ${STORE_NAME}`,
        html: receiptHtml(order, items),
        text: receiptText(order, items),
      })
    } catch (error) {
      console.error(`[email:${label}] Customer receipt failed:`, error)
    }
  }

  const merchantTo = process.env.MERCHANT_ORDER_EMAIL?.trim()
  if (merchantTo) {
    try {
      await sender({
        to: merchantTo,
        subject: `New order ${orderLabel} — ${money(order.total_amount)} — ${order.customer_name}`,
        html: merchantHtml(order, items),
        text: merchantText(order, items),
      })
    } catch (error) {
      console.error(`[email:${label}] Merchant notification failed:`, error)
    }
  } else {
    console.warn('[email] MERCHANT_ORDER_EMAIL not set — skipping store notification.')
  }

  // Optional: email-to-SMS gateway (free SMS via your phone carrier).
  // Format: <10-digit-number>@<carrier-gateway> e.g. 6142904260@vtext.com
  //   Verizon: vtext.com         AT&T:   txt.att.net
  //   T-Mobile: tmomail.net      Sprint: messaging.sprintpcs.com
  const smsGateway = process.env.MERCHANT_SMS_GATEWAY_EMAIL?.trim()
  if (smsGateway) {
    const shortBody = `New order ${orderLabel} — ${money(order.total_amount)} from ${order.customer_name}${order.city ? ` (${order.city})` : ''}`
    try {
      await sender({
        to: smsGateway,
        subject: '', // most carrier gateways prepend subject to the SMS body, so leave blank
        html: shortBody,
        text: shortBody,
      })
    } catch (error) {
      console.error(`[email:${label}] SMS gateway failed:`, error)
    }
  }
}

// ---------------------------------------------------------------------------
// Order status change notification (sent when admin updates an order status)
// ---------------------------------------------------------------------------

export type OrderForStatusEmail = {
  id: string
  order_number?: number | null
  customer_name: string
  customer_email: string
  total_amount: number
  tracking_number?: string | null
  shipping_method?: string | null
}

function statusHeadline(status: OrderStatus, pickup = false): string {
  switch (status) {
    case 'ordered': return 'Order received'
    case 'processing': return 'We are preparing your order'
    case 'ready_for_pickup': return 'Your order is ready for pickup'
    case 'shipped': return 'Your order has shipped'
    case 'out_for_delivery': return 'Out for delivery'
    case 'delivered': return pickup ? 'Your order was picked up' : 'Your order was delivered'
    case 'cancelled': return 'Your order was cancelled'
    default: return 'Order update'
  }
}

function statusBody(status: OrderStatus, tracking?: string | null, pickup = false, orderLabel?: string): string {
  switch (status) {
    case 'ordered':
      return 'Thanks — we have received your order and will start preparing it shortly.'
    case 'processing':
      return pickup
        ? 'Good news — we have started preparing your order for pickup.'
        : 'Good news — we have started preparing your order.'
    case 'ready_for_pickup':
      return `Your order is bagged and waiting at ${STORE.address} (${STORE.hours}). Please collect it within ${PICKUP_HOLD_HOURS} hours. Sending an Uber, DoorDash, or a friend? Have them show order ${orderLabel ?? ''} at the counter.`.trim()
    case 'shipped':
      return tracking
        ? `Your order is on its way. Tracking number: ${tracking}.`
        : 'Your order has shipped and is on its way.'
    case 'out_for_delivery':
      return tracking
        ? `Your order is out for delivery today. Tracking number: ${tracking}.`
        : 'Your order is out for delivery today.'
    case 'delivered':
      return pickup
        ? 'Your order has been picked up. Thanks for shopping with us!'
        : 'Your order has been delivered. We hope you enjoy it — thanks for shopping with us!'
    case 'cancelled':
      return 'Your order was cancelled. If this was unexpected, please reply to this email and we will help.'
    default:
      return 'There is an update to your order.'
  }
}

function statusEmailHtml(
  order: OrderForStatusEmail,
  status: OrderStatus,
  note?: string | null,
): string {
  const base = getPublicSiteUrl()
  const trackPath = `/track-order?id=${encodeURIComponent(trackQueryValue(order))}`
  const trackUrl = base ? `${base}${trackPath}` : trackPath
  const pickup = isPickupShippingMethod(order.shipping_method)
  const headline = statusHeadline(status, pickup)
  const body = statusBody(status, order.tracking_number, pickup, orderRefLabel(order))
  const noteBlock = note?.trim()
    ? `<p style="margin:8px 0 0;font-size:14px;color:#444;"><em>${escapeHtml(note.trim())}</em></p>`
    : ''

  return `
<!DOCTYPE html>
<html><body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#111;background:#f9f9f9;margin:0;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #e5e5e5;">
    <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#0f3d2e;font-weight:600;">${escapeHtml(STORE_NAME)}</p>
    <h1 style="margin:0 0 12px;font-size:22px;">${escapeHtml(headline)}</h1>
    <p style="margin:0 0 8px;color:#444;font-size:15px;">Hi ${escapeHtml(order.customer_name)},</p>
    <p style="margin:0 0 16px;color:#333;font-size:15px;">${escapeHtml(body)}</p>
    ${noteBlock}
    <p style="margin:16px 0 4px;font-size:13px;color:#666;"><strong>Order:</strong> ${escapeHtml(orderRefLabel(order))}</p>
    <p style="margin:0 0 4px;font-size:13px;color:#666;"><strong>Status:</strong> ${escapeHtml(orderStatusLabel(status, { pickup }))}</p>
    <p style="margin:0 0 16px;font-size:13px;color:#666;"><strong>Total:</strong> ${money(order.total_amount)}</p>
    <p style="margin:24px 0 0;">
      <a href="${trackUrl}" style="display:inline-block;background:#0f3d2e;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:600;">View order status</a>
    </p>
  </div>
  <p style="max-width:560px;margin:16px auto 0;text-align:center;font-size:12px;color:#888;">You are receiving this because you placed an order at ${escapeHtml(STORE_NAME)}.</p>
</body></html>`
}

function statusEmailText(
  order: OrderForStatusEmail,
  status: OrderStatus,
  note?: string | null,
): string {
  const base = getPublicSiteUrl()
  const trackQ = trackQueryValue(order)
  const trackUrl = base ? `${base}/track-order?id=${trackQ}` : `/track-order?id=${trackQ}`
  const pickup = isPickupShippingMethod(order.shipping_method)
  const lines = [
    `${STORE_NAME} — ${statusHeadline(status, pickup)}`,
    ``,
    `Hi ${order.customer_name},`,
    ``,
    statusBody(status, order.tracking_number, pickup, orderRefLabel(order)),
  ]
  if (note?.trim()) {
    lines.push('', note.trim())
  }
  lines.push(
    ``,
    `Order: ${orderRefLabel(order)}`,
    `Status: ${orderStatusLabel(status, { pickup })}`,
    `Total: ${money(order.total_amount)}`,
    ``,
    `Track: ${trackUrl}`,
  )
  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Out-of-stock adjustment notice (sent when an order is partially fulfilled)
// ---------------------------------------------------------------------------

export type ShortfallEmailLine = {
  productName: string
  missingQuantity: number
  orderedQuantity: number
}

/**
 * Tell the customer which items were unavailable and what came back to their
 * card. Sent immediately after the refund clears so the numbers always match.
 */
export async function sendShortfallEmail(input: {
  order: OrderForStatusEmail
  shortLines: ShortfallEmailLine[]
  refundAmount: number
}): Promise<boolean> {
  const picked = pickSender()
  if (!picked) {
    console.warn('[email] No email transport configured — skipping shortfall notice.')
    return false
  }
  const { order, shortLines, refundAmount } = input
  if (isPlaceholderCustomerEmail(order.customer_email) || !shortLines.length) return false

  const orderLabel = orderRefLabel(order)
  const base = getPublicSiteUrl()
  const trackPath = `/track-order?id=${encodeURIComponent(trackQueryValue(order))}`
  const trackUrl = base ? `${base}${trackPath}` : trackPath

  const rows = shortLines
    .map(
      (line) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(line.productName)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${line.missingQuantity} of ${line.orderedQuantity}</td>
    </tr>`
    )
    .join('')

  const refundLine =
    refundAmount > 0
      ? `We have refunded ${money(refundAmount)} to your original payment method. Bank posting usually takes 5–10 business days.`
      : 'No charge was taken for these items.'

  const html = `
<!DOCTYPE html>
<html><body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#111;background:#f9f9f9;margin:0;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #e5e5e5;">
    <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#0f3d2e;font-weight:600;">${escapeHtml(STORE_NAME)}</p>
    <h1 style="margin:0 0 12px;font-size:22px;">Some items were unavailable</h1>
    <p style="margin:0 0 8px;color:#444;font-size:15px;">Hi ${escapeHtml(order.customer_name)},</p>
    <p style="margin:0 0 16px;color:#333;font-size:15px;">We packed order ${escapeHtml(orderLabel)} and came up short on the items below. The rest of your order is unaffected.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="background:#0f3d2e;color:#fff;">
          <th style="padding:10px 12px;text-align:left;">Item</th>
          <th style="padding:10px 12px;text-align:right;">Unavailable</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin:16px 0 0;padding:12px;background:#f4f8f6;border-radius:8px;font-size:14px;color:#0f3d2e;">${escapeHtml(refundLine)}</p>
    <p style="margin:24px 0 0;">
      <a href="${trackUrl}" style="display:inline-block;background:#0f3d2e;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:600;">View your receipt</a>
    </p>
  </div>
</body></html>`

  const text = [
    `${STORE_NAME} — some items were unavailable`,
    ``,
    `Hi ${order.customer_name},`,
    ``,
    `We packed order ${orderLabel} and came up short on:`,
    ...shortLines.map((l) => `- ${l.productName}: ${l.missingQuantity} of ${l.orderedQuantity} unavailable`),
    ``,
    refundLine,
    ``,
    `Receipt: ${trackUrl}`,
  ].join('\n')

  try {
    await picked.sender({
      to: order.customer_email,
      subject: `Items unavailable on order ${orderLabel}`,
      html,
      text,
    })
    return true
  } catch (error) {
    console.error(`[email:${picked.label}] Shortfall notice failed:`, error)
    return false
  }
}

/**
 * Send a status-change notification to the customer. Called from the admin
 * "update order" API after a successful PATCH. Failures are logged and do not
 * throw — we never want a flaky email to break an otherwise-successful update.
 */
export async function sendOrderStatusEmail(
  order: OrderForStatusEmail,
  status: OrderStatus,
  note?: string | null,
): Promise<boolean> {
  const picked = pickSender()
  if (!picked) {
    console.warn('[email] No email transport configured — skipping status update email.')
    return false
  }
  if (isPlaceholderCustomerEmail(order.customer_email)) {
    console.warn('[email] Order has no real customer_email — skipping status update.')
    return false
  }
  const { sender, label } = picked
  const orderLabel = orderRefLabel(order)
  const headline = statusHeadline(status, isPickupShippingMethod(order.shipping_method))
  try {
    await sender({
      to: order.customer_email,
      subject: `${headline} — Order ${orderLabel}`,
      html: statusEmailHtml(order, status, note),
      text: statusEmailText(order, status, note),
    })
    return true
  } catch (error) {
    console.error(`[email:${label}] Status update email failed:`, error)
    return false
  }
}
