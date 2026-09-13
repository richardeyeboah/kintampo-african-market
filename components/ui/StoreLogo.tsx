import Link from 'next/link'
import Image from 'next/image'
import { STORE } from '@/lib/constants/store'
import { cn } from '@/lib/utils'

type StoreLogoProps = {
  className?: string
  /** `nav` = header. `footer` = expanded lockup. `mark` = standalone. */
  variant?: 'nav' | 'footer' | 'mark'
  linked?: boolean
}

const SIZES = {
  nav: {
    mark: 32,
    name: 'text-[22px] sm:text-[25px]',
    sub: 'text-[7.5px] tracking-[0.28em] sm:text-[8.5px]',
    tagline: false,
  },
  mark: {
    mark: 40,
    name: 'text-[28px]',
    sub: 'text-[9px] tracking-[0.28em]',
    tagline: false,
  },
  footer: {
    mark: 44,
    name: 'text-[26px]',
    sub: 'text-[9px] tracking-[0.28em]',
    tagline: true,
  },
} as const

/**
 * Brand mark (Kintampo K) + Syne wordmark with Montserrat descriptor.
 */
function Lockup({ variant }: { variant: keyof typeof SIZES }) {
  const s = SIZES[variant]
  return (
    <span className="inline-flex items-center gap-2.5">
      <Image
        src="/brand/logo-mark.png"
        alt=""
        width={s.mark}
        height={s.mark}
        className="shrink-0 rounded-[9px]"
        priority={variant === 'nav'}
      />
      <span className="inline-flex flex-col">
        <span className={cn('wordmark leading-[0.9]', s.name, 'text-earth-900')}>
          Kintampo<span className="text-brand-600">.</span>
        </span>
        <span
          className={cn(
            'mt-1.5 font-sans font-bold uppercase leading-none',
            s.sub,
            'text-earth-500'
          )}
        >
          African Market
        </span>
        {s.tagline && (
          <span className="mt-2 max-w-[15rem] font-sans text-[11px] font-normal leading-snug normal-case tracking-normal text-earth-500">
            {STORE.tagline}
          </span>
        )}
      </span>
    </span>
  )
}

export function StoreLogo({ className, variant = 'nav', linked = true }: StoreLogoProps) {
  const inner = <Lockup variant={variant} />

  if (!linked) {
    return <div className={cn('inline-flex shrink-0', className)}>{inner}</div>
  }

  return (
    <Link
      href="/"
      className={cn(
        'inline-flex shrink-0 no-underline transition-opacity duration-150 hover:opacity-85',
        className
      )}
      aria-label={`${STORE.name} — home`}
    >
      {inner}
    </Link>
  )
}
