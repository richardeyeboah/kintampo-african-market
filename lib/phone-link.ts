/** Helpers for turning stored customer phone strings into dialable links. */

function digitsOnly(raw: string | null | undefined): string {
  return (raw ?? '').replace(/\D/g, '')
}

/** E.164 for US numbers; returns null when the input can't be dialed. */
export function toDialable(raw: string | null | undefined): string | null {
  const digits = digitsOnly(raw)
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  if (digits.length >= 8) return `+${digits}`
  return null
}

export function telHref(raw: string | null | undefined): string | null {
  const dialable = toDialable(raw)
  return dialable ? `tel:${dialable}` : null
}

export function smsHref(raw: string | null | undefined): string | null {
  const dialable = toDialable(raw)
  return dialable ? `sms:${dialable}` : null
}

/**
 * WhatsApp deep link. `text` is prefilled into the compose box.
 * Uses wa.me (works on mobile + desktop WhatsApp Web).
 */
export function whatsappHref(
  raw: string | null | undefined,
  text?: string
): string | null {
  const dialable = toDialable(raw)
  if (!dialable) return null
  const digits = dialable.replace(/\D/g, '')
  const base = `https://wa.me/${digits}`
  if (!text?.trim()) return base
  return `${base}?text=${encodeURIComponent(text.trim())}`
}

/** (614) 325-7385 for 10-digit US numbers, otherwise the original string. */
export function formatPhoneDisplay(raw: string | null | undefined): string {
  const digits = digitsOnly(raw)
  const local = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits
  if (local.length === 10) {
    return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`
  }
  return (raw ?? '').trim()
}
