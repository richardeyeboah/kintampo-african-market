'use client'

import { useEffect, useState } from 'react'

/**
 * Read URL search params on the client without `useSearchParams()`.
 * Avoids wrapping entire login/signup pages in Suspense (which can stick on "Loading…").
 */
export function useClientSearchParams() {
  const [ready, setReady] = useState(false)
  const [next, setNext] = useState('/')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    const nextRaw = sp.get('next') ?? '/'
    setNext(nextRaw.startsWith('/') ? nextRaw : '/')
    setError(sp.get('error'))
    setReady(true)
  }, [])

  return { ready, next, error }
}
