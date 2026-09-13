'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Download, Share, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const DISMISS_KEY = 'kam_pwa_install_dismissed_v1'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isIos() {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isStandalone() {
  if (typeof window === 'undefined') return false
  const iosStandalone =
    'standalone' in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  return window.matchMedia('(display-mode: standalone)').matches || iosStandalone
}

/**
 * Utility install prompt — Chrome/Android uses beforeinstallprompt;
 * iOS shows Add to Home Screen steps. Dismissible; no idle animation.
 */
export function PwaInstallBanner() {
  const pathname = usePathname()
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [iosHint, setIosHint] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY) === '1') return
    } catch {
      /* ignore */
    }
    if (isStandalone()) return

    const onBip = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', onBip)

    if (isIos()) {
      setIosHint(true)
      setVisible(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', onBip)
  }, [])

  function dismiss() {
    setVisible(false)
    setDeferred(null)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    try {
      await deferred.userChoice
    } catch {
      /* ignore */
    }
    dismiss()
  }

  if (!visible) return null
  if (pathname.startsWith('/checkout')) return null

  return (
    <div
      className={cn(
        'fixed inset-x-0 z-[45] border-t border-earth-200 bg-white px-3 py-2 shadow-[0_-4px_16px_rgb(31_31_31/0.06)]',
        'bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-sm sm:rounded-2xl sm:border'
      )}
      role="dialog"
      aria-label="Install app"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Download className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-earth-900">Install Kintampo</p>
          {iosHint && !deferred ? (
            <p className="mt-0.5 text-xs leading-snug text-earth-600">
              Tap Share <Share className="inline h-3.5 w-3.5" aria-hidden /> then Add to Home Screen.
            </p>
          ) : (
            <p className="mt-0.5 text-xs leading-snug text-earth-600">
              Home screen shortcut for faster shopping.
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {deferred && (
              <button
                type="button"
                onClick={install}
                className="inline-flex min-h-11 items-center rounded-xl bg-earth-900 px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-earth-800"
              >
                Install
              </button>
            )}
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-earth-600 transition-colors duration-150 hover:bg-earth-100 hover:text-earth-900"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-earth-500 transition-colors duration-150 hover:bg-earth-100 hover:text-earth-900"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}
