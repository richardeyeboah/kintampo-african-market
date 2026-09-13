import { cn } from '@/lib/utils'

type PageHeaderProps = {
  eyebrow?: string
  title: string
  subtitle?: string
  className?: string
  centered?: boolean
}

export function PageHeader({ eyebrow, title, subtitle, className, centered }: PageHeaderProps) {
  return (
    <div className={cn('border-b border-earth-200 bg-white', className)}>
      <div className={cn('store-container py-6 sm:py-8', centered && 'text-center')}>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-wider text-earth-500">
            {eyebrow}
          </p>
        )}
        <h1
          className={cn(
            'text-2xl font-semibold tracking-tight text-earth-900 sm:text-3xl',
            eyebrow && 'mt-1'
          )}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className={cn(
              'mt-1.5 max-w-2xl text-sm leading-relaxed text-earth-600',
              centered && 'mx-auto'
            )}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
