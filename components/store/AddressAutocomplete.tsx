'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import type { AddressSuggestion, ParsedAddress } from '@/lib/address/types'

export type { ParsedAddress }

type Props = {
  value: string
  onChange: (v: string) => void
  onSelect: (addr: ParsedAddress) => void
  onVerifiedChange?: (verified: boolean) => void
  required?: boolean
  id?: string
  name?: string
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  onVerifiedChange,
  required,
  id,
  name = 'address1',
}: Props) {
  const listId = useId()
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [provider, setProvider] = useState<'google' | 'geoapify' | 'photon' | 'none'>('none')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [verified, setVerified] = useState(false)
  const [touchError, setTouchError] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<number | undefined>(undefined)

  function setVerifiedState(next: boolean) {
    setVerified(next)
    onVerifiedChange?.(next)
    if (next) setTouchError('')
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function fetchSuggestions(query: string) {
    const trimmed = query.trim()
    if (trimmed.length < 3) {
      setSuggestions([])
      setLoading(false)
      setOpen(false)
      return
    }

    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true)

    fetch('/api/address/autocomplete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: trimmed }),
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { suggestions?: AddressSuggestion[]; provider?: string }) => {
        const list = Array.isArray(data.suggestions) ? data.suggestions : []
        setSuggestions(list)
        setProvider(
          data.provider === 'google'
            ? 'google'
            : data.provider === 'geoapify'
              ? 'geoapify'
              : data.provider === 'photon'
                ? 'photon'
                : 'none'
        )
        setOpen(list.length > 0)
        setActiveIndex(-1)
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') setSuggestions([])
      })
      .finally(() => setLoading(false))
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value
    onChange(next)
    setVerifiedState(false)
    window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => fetchSuggestions(next), 200)
  }

  async function pick(s: AddressSuggestion) {
    if (s.source === 'google' && s.placeId) {
      setLoadingDetails(true)
      try {
        const res = await fetch('/api/address/place', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ placeId: s.placeId }),
        })
        const data = (await res.json()) as { address?: ParsedAddress; error?: string }
        if (!res.ok || !data.address) {
          setTouchError(data.error ?? 'Could not load that address. Try another suggestion.')
          return
        }
        onChange(data.address.line1)
        onSelect(data.address)
        setVerifiedState(true)
      } catch {
        setTouchError('Could not load address. Try again.')
      } finally {
        setLoadingDetails(false)
        setOpen(false)
        setSuggestions([])
      }
      return
    }

    onChange(s.parsed.line1)
    onSelect(s.parsed)
    setVerifiedState(true)
    setOpen(false)
    setSuggestions([])
    setActiveIndex(-1)
  }

  function handleBlur() {
    if (!verified && value.trim().length >= 3 && suggestions.length === 0) {
      setTouchError('Select your address from the US list — do not type a made-up street.')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      void pick(suggestions[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const activeOptionId =
    activeIndex >= 0 && suggestions[activeIndex] ? `${listId}-opt-${activeIndex}` : undefined

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        id={id}
        name={name}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true)
        }}
        required={required}
        autoComplete="off"
        spellCheck={false}
        placeholder="Start typing — select from the list"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeOptionId}
        aria-invalid={Boolean(touchError)}
        className={loading || loadingDetails ? 'pr-10' : undefined}
      />

      {(loading || loadingDetails) && (
        <span
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-earth-200 border-t-brand-600"
          aria-hidden
        />
      )}

      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-lg border border-earth-200 bg-white py-1 shadow-[var(--shadow-elev)]"
          role="listbox"
        >
          {suggestions.map((s, i) => {
            const isActive = i === activeIndex
            return (
              <li key={s.id} id={`${listId}-opt-${i}`} role="presentation">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => void pick(s)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`block w-full px-3 py-2.5 text-left transition-colors duration-150 ${
                    isActive ? 'bg-earth-50' : 'hover:bg-earth-50'
                  }`}
                  role="option"
                  aria-selected={isActive}
                >
                  <span className="block text-sm font-medium text-earth-900">{s.primary}</span>
                  {s.secondary ? (
                    <span className="mt-0.5 block text-xs text-earth-500">{s.secondary}</span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {verified ? (
        <p className="mt-1.5 text-xs font-medium text-brand-700">Address verified</p>
      ) : (
        <p className="mt-1.5 text-xs text-earth-500">
          {provider === 'geoapify'
            ? 'US addresses — pick one match to continue.'
            : provider === 'google'
              ? 'US addresses from Google — pick one match to continue.'
              : 'US street addresses only — pick a match with street number and ZIP.'}
        </p>
      )}

      {touchError && !verified ? (
        <p className="mt-1 text-xs font-medium text-red-700" role="alert">
          {touchError}
        </p>
      ) : null}
    </div>
  )
}
