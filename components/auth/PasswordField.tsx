'use client'

import { useId, useState } from 'react'
import { evaluatePasswordStrength, type PasswordStrength } from '@/lib/auth/password-strength'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Props = {
  id?: string
  name?: string
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: 'new-password' | 'current-password'
  disabled?: boolean
  showStrengthMeter?: boolean
  required?: boolean
}

export function PasswordField({
  id: idProp,
  name = 'password',
  label,
  value,
  onChange,
  autoComplete,
  disabled,
  showStrengthMeter,
  required = true,
}: Props) {
  const genId = useId()
  const id = idProp ?? `${genId}-password`
  const [visible, setVisible] = useState(false)
  const strength: PasswordStrength | null =
    showStrengthMeter && value.length > 0 ? evaluatePasswordStrength(value) : null

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={id} className="form-label mb-0">
          {label}
        </label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-11 min-w-11 px-2 text-xs"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
        >
          {visible ? 'Hide' : 'Show'}
        </Button>
      </div>
      <Input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {strength && (
        <p className="muted mt-1.5" aria-live="polite">
          Strength: {strength.label}
          {strength.hints.length > 0 ? ` (${strength.hints.join(' · ')})` : ''}
        </p>
      )}
    </div>
  )
}
