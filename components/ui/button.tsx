import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-earth-900/10 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-earth-900 text-white shadow-[var(--shadow-card)] hover:bg-earth-800 hover:shadow-[var(--shadow-card-hover)]',
        accent:
          'bg-earth-900 text-white hover:bg-earth-800',
        outline:
          'border border-earth-200 bg-white text-earth-800 shadow-[var(--shadow-card)] hover:border-earth-300 hover:bg-earth-50',
        ghost: 'text-earth-700 hover:bg-earth-100 hover:text-earth-900',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        link: 'text-earth-900 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 min-h-11 px-4 py-2',
        sm: 'h-11 min-h-11 px-3 text-xs',
        lg: 'h-12 min-h-12 px-6 text-base',
        icon: 'h-11 w-11 min-h-11 min-w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
)
Button.displayName = 'Button'

export { buttonVariants }
