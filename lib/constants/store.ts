/** Public inbox for customer contact & feedback (override with NEXT_PUBLIC_SUPPORT_EMAIL). */
export const DEFAULT_SUPPORT_EMAIL = 'kalebdoffour@gmail.com'

export function getSupportEmail(): string {
  return process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || DEFAULT_SUPPORT_EMAIL
}

/** Where feedback form submissions are delivered (server-only env). */
export function getFeedbackInbox(): string {
  return (
    process.env.FEEDBACK_TO_EMAIL?.trim() ||
    process.env.MERCHANT_ORDER_EMAIL?.trim() ||
    getSupportEmail()
  )
}

export const STORE = {
  name: 'Kintampo African Market',
  shortName: 'Kintampo Market',
  tagline: 'Groceries from Ghana & the Caribbean.',
  supportEmail: DEFAULT_SUPPORT_EMAIL,
  address: '1668 E Dublin Granville Rd, Columbus, OH 43229',
  /** Ship-from for packing slips. Env vars override these. */
  shipFrom: {
    street1: '1668 E Dublin Granville Rd',
    street2: '',
    city: 'Columbus',
    state: 'OH',
    zip: '43229',
    country: 'US',
    phone: '6143778297',
  },
  phone: '(614) 377-8297',
  phoneHref: 'tel:+16143778297',
  phoneAlt: '(614) 325-7385',
  phoneAltHref: 'tel:+16143257385',
  phoneAlt2: '(614) 323-7385',
  phoneAlt2Href: 'tel:+16143237385',
  hours: 'Mon–Sat 9am–8pm · Sun 10am–6pm',
} as const

/**
 * WhatsApp Business / store line. Defaults to the primary store phone.
 * Override with NEXT_PUBLIC_WHATSAPP_NUMBER (digits or +E.164).
 */
export function getWhatsAppNumber(): string {
  return process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() || STORE.shipFrom.phone
}

export const ORDER_BY_PHONE_PREFILL =
  'Hi, I would like to place an order from Kintampo African Market:'

/** All public store phone lines (primary + alternates). */
export const STORE_PHONES = [
  { label: STORE.phone, href: STORE.phoneHref },
  { label: STORE.phoneAlt, href: STORE.phoneAltHref },
  { label: STORE.phoneAlt2, href: STORE.phoneAlt2Href },
] as const

/** Plain-text phone list for announcements. */
export function storePhonesPlain(): string {
  return STORE_PHONES.map((p) => p.label).join(' · ')
}
