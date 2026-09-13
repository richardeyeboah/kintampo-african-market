import { MapPin } from 'lucide-react'
import { STORE } from '@/lib/constants/store'

type PickupPromoBannerProps = {
  className?: string
  compact?: boolean
}

export function PickupPromoBanner({ className = '', compact = false }: PickupPromoBannerProps) {
  return (
    <div
      className={`rounded-xl border border-brand-200 bg-brand-50/70 px-4 py-3 text-sm text-earth-800 ${className}`}
      role="note"
    >
      <p className="font-semibold text-earth-900">
        {compact ? 'Columbus pickup — free' : 'Columbus? Pick up free at our store'}
      </p>
      <p className={`mt-1 leading-relaxed text-earth-700 ${compact ? 'text-xs' : 'text-sm'}`}>
        Choose <strong>Store Pickup</strong> at checkout. Pay online, then come in or send Uber /
        DoorDash with your order number.
      </p>
      <p className="mt-2 flex items-start gap-1.5 text-xs text-earth-600">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden />
        <span>{STORE.address}</span>
      </p>
    </div>
  )
}
