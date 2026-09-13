'use client'

import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js'
import type {
  Appearance,
  StripeElementsOptions,
  StripeExpressCheckoutElementConfirmEvent,
} from '@stripe/stripe-js'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { getStripeBrowser, isStripePublishableKeyConfigured } from '@/lib/stripe-browser'
import { cn } from '@/lib/utils'

type Props = {
  clientSecret: string
  returnUrl: string
  totalLabel: string
}

const CHECKOUT_APPEARANCE: Appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#006b3e',
    colorBackground: '#ffffff',
    colorText: '#18181b',
    colorDanger: '#b91c1c',
    borderRadius: '10px',
    fontFamily: 'Montserrat, system-ui, sans-serif',
  },
  rules: {
    '.Tab': {
      border: '1px solid #e6e6e3',
      boxShadow: 'none',
    },
    '.Tab--selected': {
      border: '1px solid #006b3e',
      color: '#006b3e',
    },
    '.Label': {
      fontWeight: '600',
    },
  },
}

function paymentIntentIdFromClientSecret(clientSecret: string): string | null {
  const idx = clientSecret.indexOf('_secret_')
  if (idx <= 0) return null
  return clientSecret.slice(0, idx)
}

function PayForm({ clientSecret, returnUrl, totalLabel }: Props) {
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [walletAvailable, setWalletAvailable] = useState(false)

  const returnUrlReady = returnUrl.length > 0

  function finishPayment() {
    const piId = paymentIntentIdFromClientSecret(clientSecret)
    router.push(
      piId
        ? `/checkout/success?payment_intent=${encodeURIComponent(piId)}`
        : '/checkout/success'
    )
  }

  async function confirmPayment(): Promise<string | null> {
    if (!stripe || !elements) return 'Payment form is still loading. Wait a few seconds and try again.'

    try {
      const result = await Promise.race([
        stripe.confirmPayment({
          elements,
          clientSecret,
          confirmParams: { return_url: returnUrl },
          redirect: 'if_required',
        }),
        new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new Error('timeout')), 90_000)
        }),
      ])
      return result.error?.message ?? null
    } catch (err) {
      return err instanceof Error && err.message === 'timeout'
        ? 'Payment is taking too long. If your card was charged, check your email or Account → orders. Otherwise try again.'
        : 'Payment could not be completed. Please try again.'
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) {
      setError('Payment form is still loading. Wait a few seconds and try again.')
      return
    }
    if (!returnUrlReady) {
      setError('Checkout is still loading. Please wait and try again.')
      return
    }

    setBusy(true)
    setError('')

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message ?? 'Please check your payment details.')
      setBusy(false)
      return
    }

    const confirmError = await confirmPayment()
    if (confirmError) {
      setError(confirmError)
      setBusy(false)
      return
    }

    finishPayment()
  }

  async function handleExpressConfirm(event: StripeExpressCheckoutElementConfirmEvent) {
    if (!returnUrlReady || busy) {
      event.paymentFailed({ reason: 'fail', message: 'Checkout is still loading. Please try again.' })
      return
    }

    setBusy(true)
    setError('')
    const confirmError = await confirmPayment()

    if (confirmError) {
      setError(confirmError)
      setBusy(false)
      event.paymentFailed({ reason: 'fail', message: confirmError })
      return
    }

    finishPayment()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <section
        aria-label="Express checkout"
        className={cn(
          'rounded-xl border border-earth-200 bg-earth-50 p-3 sm:p-4',
          !walletAvailable && 'hidden'
        )}
      >
        <div className="mb-3">
          <p className="text-sm font-semibold text-earth-900">Express checkout</p>
          <p className="mt-0.5 text-xs text-earth-500">Pay securely with your saved wallet.</p>
        </div>
        <ExpressCheckoutElement
          options={{
            buttonHeight: 52,
            buttonTheme: {
              applePay: 'black',
              googlePay: 'black',
            },
            buttonType: {
              applePay: 'buy',
              googlePay: 'buy',
            },
            layout: {
              maxColumns: 2,
              maxRows: 1,
              overflow: 'auto',
            },
            paymentMethodOrder: ['apple_pay', 'google_pay'],
            paymentMethods: {
              applePay: 'auto',
              googlePay: 'auto',
              amazonPay: 'never',
              link: 'never',
              paypal: 'never',
              klarna: 'never',
            },
          }}
          onReady={({ availablePaymentMethods }) => {
            setWalletAvailable(
              Boolean(availablePaymentMethods?.applePay || availablePaymentMethods?.googlePay)
            )
          }}
          onConfirm={handleExpressConfirm}
        />
      </section>

      {walletAvailable ? (
        <div className="flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-earth-200" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-earth-500">
            Or pay by card
          </span>
          <span className="h-px flex-1 bg-earth-200" />
        </div>
      ) : null}

      <div className="rounded-xl border border-earth-200 bg-white p-3 sm:p-4">
        <PaymentElement
          options={{
            paymentMethodOrder: ['card'],
            layout: {
              type: 'tabs',
              defaultCollapsed: false,
            },
            wallets: {
              applePay: 'never',
              googlePay: 'never',
            },
          }}
        />
      </div>

      {error ? (
        <p className="text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="max-md:sticky max-md:bottom-0 max-md:z-10 max-md:-mx-1 max-md:border-t max-md:border-earth-200 max-md:bg-white max-md:px-1 max-md:pb-[max(0.75rem,env(safe-area-inset-bottom))] max-md:pt-3">
        <Button
          type="submit"
          size="lg"
          disabled={!stripe || !elements || busy || !returnUrlReady}
          className={cn(
            'h-14 w-full rounded-xl text-base font-bold tracking-tight',
            'bg-brand-700 shadow-[var(--shadow-card-hover)] hover:bg-brand-800',
            'focus-visible:ring-4 focus-visible:ring-brand-600/30'
          )}
        >
          {!returnUrlReady
            ? 'Loading payment…'
            : busy
              ? 'Processing…'
              : `Pay ${totalLabel}`}
        </Button>
      </div>
    </form>
  )
}

export function CheckoutStripePayment({ clientSecret, returnUrl, totalLabel }: Props) {
  const stripePromise = useMemo(() => getStripeBrowser(), [])

  const elementsOptions: StripeElementsOptions = useMemo(
    () => ({
      clientSecret,
      appearance: CHECKOUT_APPEARANCE,
    }),
    [clientSecret]
  )

  if (!isStripePublishableKeyConfigured()) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-red-700">
          Online payments are temporarily unavailable.
        </p>
        <p className="text-sm text-earth-500">
          Please try again shortly or contact the store to complete your order.
        </p>
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise} options={elementsOptions}>
      <PayForm clientSecret={clientSecret} returnUrl={returnUrl} totalLabel={totalLabel} />
    </Elements>
  )
}
