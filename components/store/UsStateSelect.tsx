import { US_STATE_OPTIONS } from '@/lib/address/us-states'

type Props = {
  id?: string
  name?: string
  value: string
  onChange: (code: string) => void
  required?: boolean
}

export function UsStateSelect({ id, name = 'state', value, onChange, required }: Props) {
  return (
    <select
      id={id}
      name={name}
      className="form-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      autoComplete="shipping address-level1"
    >
      <option value="">State</option>
      {US_STATE_OPTIONS.map((s) => (
        <option key={s.code} value={s.code}>
          {s.name}
        </option>
      ))}
    </select>
  )
}
