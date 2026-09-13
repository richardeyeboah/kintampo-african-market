'use client'

import { useEffect, useState } from 'react'
import { ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className={cn(
        'fixed bottom-[5.5rem] right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-earth-200 bg-white shadow-[var(--shadow-card)] transition-opacity duration-200 hover:bg-earth-50 md:bottom-6',
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      <ChevronUp className="h-5 w-5 text-earth-700" />
    </button>
  )
}
