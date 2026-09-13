import { getFeedbackInbox, getSupportEmail, STORE } from '@/lib/constants/store'
import { getPublicSiteUrl } from '@/lib/site-url'
import { sendTransactionalEmail } from '@/lib/email/send-order-emails'

export type FeedbackPayload = {
  name: string
  email: string
  category: string
  message: string
  pageUrl?: string
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const CATEGORY_LABEL: Record<string, string> = {
  suggestion: 'Site suggestion',
  bug: 'Bug or broken page',
  product: 'Product request',
  other: 'Other',
}

export async function sendFeedbackEmail(payload: FeedbackPayload): Promise<boolean> {
  const to = getFeedbackInbox()
  const categoryLabel = CATEGORY_LABEL[payload.category] ?? payload.category
  const site = getPublicSiteUrl()
  const subject = `[${STORE.shortName} feedback] ${categoryLabel}`

  const html = `
<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;padding:16px;">
  <h2 style="margin:0 0 12px;font-size:18px;">Website feedback</h2>
  <p style="margin:0 0 8px;"><strong>Category:</strong> ${escapeHtml(categoryLabel)}</p>
  <p style="margin:0 0 8px;"><strong>From:</strong> ${escapeHtml(payload.name || 'Anonymous')} &lt;${escapeHtml(payload.email)}&gt;</p>
  ${payload.pageUrl ? `<p style="margin:0 0 8px;"><strong>Page:</strong> ${escapeHtml(payload.pageUrl)}</p>` : ''}
  <p style="margin:16px 0 8px;"><strong>Message</strong></p>
  <p style="margin:0;white-space:pre-wrap;">${escapeHtml(payload.message)}</p>
  <p style="margin:24px 0 0;font-size:12px;color:#666;">Sent from ${escapeHtml(site)} feedback form.</p>
</body></html>`

  const text = [
    `Website feedback — ${STORE.name}`,
    `Category: ${categoryLabel}`,
    `From: ${payload.name || 'Anonymous'} <${payload.email}>`,
    payload.pageUrl ? `Page: ${payload.pageUrl}` : '',
    '',
    payload.message,
    '',
    `Reply to: ${payload.email}`,
  ]
    .filter(Boolean)
    .join('\n')

  return sendTransactionalEmail({ to, subject, html, text })
}

export function isFeedbackEmailConfigured(): boolean {
  return Boolean(getFeedbackInbox())
}

export function getPublicSupportMailto(): string {
  return `mailto:${getSupportEmail()}`
}
