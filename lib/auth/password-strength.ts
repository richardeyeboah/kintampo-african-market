export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4 | 5
  label: 'Too weak' | 'Weak' | 'Fair' | 'Good' | 'Strong'
  hints: string[]
}

const MIN_LEN = 8

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const hints: string[] = []
  let raw = 0

  if (password.length >= MIN_LEN) raw++
  else hints.push(`At least ${MIN_LEN} characters`)

  if (/[a-z]/.test(password)) raw++
  else hints.push('One lowercase letter')

  if (/[A-Z]/.test(password)) raw++
  else hints.push('One uppercase letter')

  if (/\d/.test(password)) raw++
  else hints.push('One number')

  if (/[^A-Za-z0-9]/.test(password)) raw++
  else hints.push('One special character')

  const score = raw as PasswordStrength['score']
  const label: PasswordStrength['label'] =
    raw <= 1 ? 'Too weak' : raw === 2 ? 'Weak' : raw === 3 ? 'Fair' : raw === 4 ? 'Good' : 'Strong'

  return { score, label, hints }
}

/** Minimum bar for signup: length + mixed character classes (all five checks). */
export function isPasswordAcceptableForSignup(password: string): boolean {
  return evaluatePasswordStrength(password).score === 5
}
