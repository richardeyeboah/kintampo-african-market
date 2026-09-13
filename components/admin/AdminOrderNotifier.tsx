'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Bell, BellOff, ShoppingBag, X } from 'lucide-react'
import { createClient, isSupabaseBrowserConfigured } from '@/lib/supabase/client'
import { formatOrderNumber } from '@/lib/orders/order-number'

type OrderRow = {
  id: string
  order_number: number | null
  customer_name: string | null
  total_amount: number | null
  created_at: string
}

type Toast = {
  id: string
  orderNumber: string
  customerName: string
  total: number
  shownAt: number
}

const STORAGE_LAST_SEEN = 'lq_admin_last_order_seen'
const STORAGE_SOUND_ON = 'lq_admin_notify_sound'
const TOAST_TTL_MS = 8000

function formatMoney(n: number | null): string {
  if (n == null || Number.isNaN(n)) return '—'
  return `$${Number(n).toFixed(2)}`
}

function playChime() {
  try {
    type AudioContextCtor = typeof AudioContext
    const w = window as unknown as {
      AudioContext?: AudioContextCtor
      webkitAudioContext?: AudioContextCtor
    }
    const Ctor = w.AudioContext ?? w.webkitAudioContext
    if (!Ctor) return
    const ctx = new Ctor()
    const now = ctx.currentTime
    const tones = [
      { freq: 880, start: now, dur: 0.18 },
      { freq: 1320, start: now + 0.16, dur: 0.22 },
    ]
    for (const t of tones) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = t.freq
      gain.gain.setValueAtTime(0.0001, t.start)
      gain.gain.exponentialRampToValueAtTime(0.18, t.start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t.start + t.dur)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t.start)
      osc.stop(t.start + t.dur + 0.02)
    }
    setTimeout(() => void ctx.close(), 1000)
  } catch {
    /* ignore */
  }
}

function maybeShowSystemNotification(order: OrderRow) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    const orderNumber = formatOrderNumber(order.order_number)
    const n = new Notification(
      orderNumber ? `New order ${orderNumber}` : 'New order received',
      {
        body: `${order.customer_name ?? 'A customer'} placed an order for ${formatMoney(order.total_amount)}.`,
        tag: `order-${order.id}`,
      }
    )
    n.onclick = () => {
      window.focus()
      window.location.href = `/admin/orders/${order.id}`
    }
  } catch {
    /* ignore */
  }
}

export function AdminOrderNotifier() {
  const pathname = usePathname()
  const [toasts, setToasts] = useState<Toast[]>([])
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported')
  const [soundOn, setSoundOn] = useState(true)
  const lastSeenRef = useRef<number>(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if ('Notification' in window) setPermission(Notification.permission)
    try {
      const stored = localStorage.getItem(STORAGE_LAST_SEEN)
      lastSeenRef.current = stored ? Number(stored) : Date.now()
      const sound = localStorage.getItem(STORAGE_SOUND_ON)
      if (sound !== null) setSoundOn(sound === '1')
    } catch {
      lastSeenRef.current = Date.now()
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) return
    const supabase = createClient()

    const channel = supabase
      .channel('admin-orders')
      .on<OrderRow>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const row = payload.new
          if (!row?.id) return
          const ts = new Date(row.created_at ?? Date.now()).getTime()
          if (Number.isFinite(ts) && ts <= lastSeenRef.current) return

          lastSeenRef.current = Math.max(lastSeenRef.current, ts)
          try {
            localStorage.setItem(STORAGE_LAST_SEEN, String(lastSeenRef.current))
          } catch {
            /* ignore */
          }

          setToasts((prev) =>
            [
              {
                id: row.id,
                orderNumber: formatOrderNumber(row.order_number),
                customerName: row.customer_name ?? 'Customer',
                total: Number(row.total_amount ?? 0),
                shownAt: Date.now(),
              },
              ...prev,
            ].slice(0, 3)
          )

          let allow = true
          try {
            allow = localStorage.getItem(STORAGE_SOUND_ON) !== '0'
          } catch {
            /* ignore */
          }
          if (allow) playChime()
          maybeShowSystemNotification(row)
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    if (toasts.length === 0) return
    const t = setInterval(() => {
      const now = Date.now()
      setToasts((prev) => prev.filter((x) => now - x.shownAt < TOAST_TTL_MS))
    }, 1000)
    return () => clearInterval(t)
  }, [toasts.length])

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((x) => x.id !== id))
  }

  async function requestPerm() {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
    } catch {
      /* ignore */
    }
  }

  function toggleSound() {
    setSoundOn((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_SOUND_ON, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }

  if (pathname === '/admin/login') return null

  return (
    <div className="admin-order-notifier">
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-earth-200 bg-white p-4 shadow-[var(--shadow-elev)] animate-pop"
          >
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <ShoppingBag className="h-4 w-4" strokeWidth={2} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-earth-900">
                {t.orderNumber ? `New order ${t.orderNumber}` : 'New order'}
              </p>
              <p className="mt-0.5 truncate text-sm text-earth-600">
                {t.customerName} ·{' '}
                <span className="tabular-nums font-medium text-earth-900">
                  {formatMoney(t.total)}
                </span>
              </p>
              <Link
                href={`/admin/orders/${t.id}`}
                onClick={() => dismiss(t.id)}
                className="mt-2 inline-block text-xs font-semibold text-brand-700 no-underline hover:text-brand-800"
              >
                Open order →
              </Link>
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-earth-400 transition-colors hover:bg-earth-100 hover:text-earth-700"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>

      <div className="fixed bottom-4 left-4 z-20 hidden rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-lg sm:block lg:left-[264px]">
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <span className="px-1 font-medium">Alerts</span>
          {permission === 'default' && (
            <button
              type="button"
              onClick={() => void requestPerm()}
              className="inline-flex min-h-7 items-center gap-1 rounded-md px-1.5 font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              <Bell className="h-3 w-3" aria-hidden />
              Enable browser alerts
            </button>
          )}
          {permission === 'granted' && (
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <Bell className="h-3 w-3" aria-hidden />
              Browser alerts on
            </span>
          )}
          <span className="text-slate-300">·</span>
          <button
            type="button"
            onClick={toggleSound}
            className="inline-flex min-h-7 items-center gap-1 rounded-md px-1.5 font-medium text-slate-700 transition-colors hover:bg-slate-100"
          >
            {soundOn ? (
              <Bell className="h-3 w-3" aria-hidden />
            ) : (
              <BellOff className="h-3 w-3" aria-hidden />
            )}
            {soundOn ? 'Chime on' : 'Chime muted'}
          </button>
        </div>
      </div>
    </div>
  )
}
