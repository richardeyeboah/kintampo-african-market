'use client'

import { SearchAutocomplete } from '@/components/store/SearchAutocomplete'

export function ShopSearchBar({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <SearchAutocomplete
      className={className}
      compact={compact}
      placeholder={compact ? 'Search products…' : 'Search products, brands, categories…'}
    />
  )
}
