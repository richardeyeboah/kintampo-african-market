import { STORE_PHONES } from '@/lib/constants/store'
import { cn } from '@/lib/utils'

type StorePhoneLinksProps = {
  className?: string
  linkClassName?: string
  separator?: string
}

/** All store numbers as tap-to-call links. */
export function StorePhoneLinks({
  className,
  linkClassName,
  separator = ' · ',
}: StorePhoneLinksProps) {
  const link =
    linkClassName ??
    'inline-flex min-h-11 items-center font-medium text-earth-900 no-underline hover:text-earth-600'

  return (
    <span className={cn('inline-flex flex-wrap items-center gap-x-1', className)}>
      {STORE_PHONES.map((phone, i) => (
        <span key={phone.href} className="inline-flex items-center gap-x-1">
          {i > 0 && (
            <span className="text-earth-400" aria-hidden>
              {separator}
            </span>
          )}
          <a href={phone.href} className={link}>
            {phone.label}
          </a>
        </span>
      ))}
    </span>
  )
}
