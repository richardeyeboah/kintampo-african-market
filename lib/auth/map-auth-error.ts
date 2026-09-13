/**
 * Map Supabase Auth errors to user-friendly, non-leaky messages.
 * Avoid revealing whether an email exists where it matters for enumeration.
 */

export function mapSignInError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials') || m.includes('invalid credentials')) {
    return 'Incorrect email or password.'
  }
  if (m.includes('email not confirmed')) {
    return 'Incorrect email or password.'
  }
  if (m.includes('too many requests') || m.includes('rate limit')) {
    return 'Too many attempts. Please wait a few minutes and try again.'
  }
  if (m.includes('network')) {
    return 'Connection problem. Check your internet and try again.'
  }
  return 'Something went wrong. Please try again.'
}

export function mapSignUpError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('already registered') || m.includes('user already registered') || m.includes('already exists')) {
    return 'An account with this email already exists. Sign in or reset your password.'
  }
  if (m.includes('password')) {
    return 'Choose a stronger password (at least 8 characters).'
  }
  if (m.includes('too many requests') || m.includes('rate limit')) {
    return 'Too many attempts. Please wait a few minutes and try again.'
  }
  if (m.includes('network')) {
    return 'Connection problem. Check your internet and try again.'
  }
  return 'Something went wrong. Please try again.'
}

export function mapPasswordResetError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('too many requests') || m.includes('rate limit')) {
    return 'Too many attempts. Please wait before requesting another link.'
  }
  return ''
}
