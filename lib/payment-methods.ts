/** Stored in `orders.payment_method` */
export type PaymentMethod = 'cod' | 'zelle' | 'manual' | 'stripe'

/** How a phone / counter order was (or will be) settled — excludes Stripe. */
export type ManualSettleMethod = Exclude<PaymentMethod, 'stripe'>

export function normalizePaymentMethod(raw: unknown): PaymentMethod {
  if (raw === 'zelle' || raw === 'manual' || raw === 'cod' || raw === 'stripe') return raw
  return 'cod'
}

export function normalizeManualSettleMethod(raw: unknown): ManualSettleMethod {
  if (raw === 'zelle' || raw === 'manual' || raw === 'cod') return raw
  return 'cod'
}

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cod: 'Cash',
  zelle: 'Zelle',
  manual: 'Card at store / other',
  stripe: 'Card (Stripe)',
}

export const MANUAL_SETTLE_OPTIONS: Array<{ value: ManualSettleMethod; label: string }> = [
  { value: 'cod', label: 'Cash' },
  { value: 'zelle', label: 'Zelle' },
  { value: 'manual', label: 'Card at store / other' },
]
