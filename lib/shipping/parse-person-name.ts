/** Split a display name into first/last for carrier APIs. */
export function parsePersonName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: 'Customer', lastName: '.' }
  if (parts.length === 1) return { firstName: parts[0]!, lastName: '.' }
  return { firstName: parts[0]!, lastName: parts.slice(1).join(' ') }
}
