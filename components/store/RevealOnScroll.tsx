import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type RevealOnScrollProps = {
  children: ReactNode
  className?: string
  delay?: number
}

// Kept as a passthrough wrapper for API compatibility — utility-first design
// avoids scroll-triggered animations to keep perceived performance high.
export function RevealOnScroll({ children, className }: RevealOnScrollProps) {
  return <div className={cn(className)}>{children}</div>
}
