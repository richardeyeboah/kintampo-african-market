'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  src: string
  alt: string
  className?: string
  loading?: 'eager' | 'lazy'
  children?: React.ReactNode
}

/** Category photos as native <img> so Vercel Image Optimization never bills them. */
export function CategoryTilePhoto({ src, alt, className, loading = 'lazy', children }: Props) {
  const [failed, setFailed] = useState(false)

  if (failed) return children ?? null

  return (
    // eslint-disable-next-line @next/next/no-img-element -- category photos skip the optimizer
    <img
      src={src}
      alt={alt}
      className={cn(className)}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}
