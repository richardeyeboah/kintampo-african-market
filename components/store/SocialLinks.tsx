import { SOCIAL_LINKS } from '@/lib/constants/social'
import { cn } from '@/lib/utils'

export function SocialLinks({ className, dark }: { className?: string; dark?: boolean }) {
  if (SOCIAL_LINKS.length === 0) return null
  return (
    <ul className={cn('flex flex-wrap gap-2', className)}>
      {SOCIAL_LINKS.map((link) => (
        <li key={link.id}>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex h-11 items-center rounded-lg border px-3 text-sm font-medium no-underline transition-colors duration-150',
              dark
                ? 'border-earth-700 text-earth-300 hover:border-earth-500 hover:text-white'
                : 'border-earth-200 text-earth-700 hover:border-earth-300 hover:bg-earth-50 hover:text-brand-700'
            )}
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  )
}
