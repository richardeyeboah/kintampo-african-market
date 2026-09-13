/**
 * Store pickup hold window. Orders staged at the counter are held for a fixed
 * number of hours before staff should chase the customer; after that the bag
 * is unclaimed and blocks counter space.
 */

export const PICKUP_HOLD_HOURS = 4

const HOUR_MS = 60 * 60 * 1000

export type PickupHold = {
  readyAt: Date
  dueAt: Date
  /** Negative once the hold window has elapsed. */
  msRemaining: number
  overdue: boolean
}

export function getPickupHold(
  readyAt: string | Date | null | undefined,
  now: number = Date.now(),
  holdHours: number = PICKUP_HOLD_HOURS
): PickupHold | null {
  if (!readyAt) return null
  const ready = readyAt instanceof Date ? readyAt : new Date(readyAt)
  const readyMs = ready.getTime()
  if (!Number.isFinite(readyMs)) return null

  const dueMs = readyMs + holdHours * HOUR_MS
  const msRemaining = dueMs - now

  return {
    readyAt: ready,
    dueAt: new Date(dueMs),
    msRemaining,
    overdue: msRemaining < 0,
  }
}

/** Coarse "3h 12m" / "14m" duration for an absolute millisecond span. */
export function formatHoldDuration(ms: number): string {
  const total = Math.max(0, Math.abs(ms))
  const minutes = Math.floor(total / 60000)
  const hours = Math.floor(minutes / 60)
  const rem = minutes % 60
  if (hours > 0) return `${hours}h ${rem}m`
  if (minutes > 0) return `${minutes}m`
  return 'under a minute'
}

export function formatClockTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}
