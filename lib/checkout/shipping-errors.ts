/** Turn API / USPS errors into plain-language checkout guidance. */
export function friendlyShippingError(raw: string | null | undefined): string {
  const msg = (raw ?? '').trim()
  if (!msg) {
    return 'We could not verify this address for shipping. Check street, city, state, and ZIP, then try again.'
  }

  const lower = msg.toLowerCase()

  if (lower.includes('zip') && (lower.includes('required') || lower.includes('missing'))) {
    return 'Enter a 5-digit US ZIP code to ship this order.'
  }
  if (lower.includes('could not confirm') || lower.includes('could not verify')) {
    return 'USPS could not confirm this address for delivery. Double-check the street number and apartment/suite, or use the suggested format below.'
  }
  if (lower.includes('standardized') || lower.includes('suggested')) {
    return 'USPS has a standardized version of this address. Use the suggested address to continue.'
  }
  if (lower.includes('deliverable') || lower.includes('undeliverable')) {
    return 'This address may not receive USPS delivery. Try a different address or choose Store Pickup if you are in Columbus.'
  }
  if (lower.includes('missing required')) {
    return 'Fill in your name, phone, and delivery address — or choose Store Pickup to skip the address.'
  }
  if (lower.includes('phone')) {
    return 'Add a phone number so we can reach you when your order is ready.'
  }
  if (lower.includes('email')) {
    return 'Enter a valid email for your receipt and order updates.'
  }

  return msg
}
