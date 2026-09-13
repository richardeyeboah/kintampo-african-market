/** How a self-driven delivery was closed out at the door. */
export type DeliveryProof = 'handed' | 'left_at_door'

export const DELIVERY_PROOF_LABEL: Record<DeliveryProof, string> = {
  handed: 'Handed to customer',
  left_at_door: 'Left at door',
}

export function normalizeDeliveryProof(value: unknown): DeliveryProof | null {
  return value === 'handed' || value === 'left_at_door' ? value : null
}
