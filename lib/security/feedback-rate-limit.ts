const WINDOW_MS = 60 * 60 * 1000
const MAX_PER_WINDOW = 5

type Entry = { count: number; resetAt: number }

const attempts = new Map<string, Entry>()

export function isFeedbackAllowed(clientKey: string): {
  allowed: boolean
  retryAfterSecs: number
} {
  const now = Date.now()
  const entry = attempts.get(clientKey)
  if (!entry || now >= entry.resetAt) {
    return { allowed: true, retryAfterSecs: 0 }
  }
  if (entry.count >= MAX_PER_WINDOW) {
    return {
      allowed: false,
      retryAfterSecs: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    }
  }
  return { allowed: true, retryAfterSecs: 0 }
}

export function recordFeedbackAttempt(clientKey: string): void {
  const now = Date.now()
  const entry = attempts.get(clientKey)
  if (!entry || now >= entry.resetAt) {
    attempts.set(clientKey, { count: 1, resetAt: now + WINDOW_MS })
    return
  }
  entry.count += 1
}
