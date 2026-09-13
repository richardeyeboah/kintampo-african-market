'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import type { AnnouncementMessage } from '@/lib/supabase/announcements'

const DISMISS_KEY = 'kam_bar_v4'

export function AnnouncementBar({ messages }: { messages: AnnouncementMessage[] }) {
  const [hidden, setHidden] = useState(false)
  const [index, setIndex] = useState(0)
  const list = messages.length > 0 ? messages : []

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY) === '1') setHidden(true)
    } catch {
      /* ignore */
    }
  }, [])

  function dismiss() {
    setHidden(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  if (hidden || list.length === 0) return null

  const msg = list[index % list.length]

  return (
    <div className="relative border-b border-earth-200 bg-white py-2 text-center text-xs font-medium text-earth-600 sm:py-2.5">
      {msg.href ? (
        <Link
          href={msg.href}
          className="block max-w-[calc(100%-2.75rem)] truncate px-3 text-earth-700 no-underline hover:text-earth-900 sm:mx-auto sm:max-w-3xl sm:px-10 sm:whitespace-normal sm:overflow-visible"
        >
          {msg.text}
        </Link>
      ) : (
        <p className="max-w-[calc(100%-2.75rem)] truncate px-3 sm:mx-auto sm:max-w-3xl sm:px-10 sm:whitespace-normal sm:overflow-visible">
          {msg.text}
        </p>
      )}

      {/* Dot pager — desktop only; saves vertical chrome on phones */}
      {list.length > 1 && (
        <div className="mt-1 hidden items-center justify-center gap-0.5 pb-0.5 sm:flex">
          {list.map((m, i) => (
            <button
              key={m.id}
              type="button"
              aria-label={`Announcement ${i + 1} of ${list.length}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-150 hover:bg-earth-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-earth-300"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  i === index ? 'bg-earth-800' : 'bg-earth-300'
                }`}
                aria-hidden
              />
            </button>
          ))}
        </div>
      )}

      {/* Mobile: advance message by tapping the bar edge control */}
      {list.length > 1 && (
        <button
          type="button"
          className="absolute left-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-earth-400 sm:hidden"
          aria-label="Next announcement"
          onClick={() => setIndex((i) => (i + 1) % list.length)}
        >
          <span className="text-[10px] font-semibold tabular-nums">
            {index + 1}/{list.length}
          </span>
        </button>
      )}

      <button
        type="button"
        onClick={dismiss}
        className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-earth-500 transition-colors duration-150 hover:bg-earth-100 hover:text-earth-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-earth-300 sm:right-2"
        aria-label="Dismiss announcement"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  )
}
