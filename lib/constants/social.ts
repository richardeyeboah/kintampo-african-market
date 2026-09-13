export type SocialLink = {
  id: 'tiktok' | 'facebook' | 'instagram'
  label: string
  href: string
}

function socialUrl(envKey: string, fallback: string): string {
  return process.env[envKey]?.trim() || fallback
}

/**
 * Official store social profiles. Set the real Kintampo profiles via
 * NEXT_PUBLIC_SOCIAL_* env vars; links with empty fallbacks are hidden.
 */
const ALL_LINKS: SocialLink[] = [
  {
    id: 'tiktok',
    label: 'TikTok',
    href: socialUrl('NEXT_PUBLIC_SOCIAL_TIKTOK_URL', ''),
  },
  {
    id: 'facebook',
    label: 'Facebook',
    href: socialUrl('NEXT_PUBLIC_SOCIAL_FACEBOOK_URL', ''),
  },
  {
    id: 'instagram',
    label: 'Instagram',
    href: socialUrl('NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL', ''),
  },
]

export const SOCIAL_LINKS: SocialLink[] = ALL_LINKS.filter((link) => link.href !== '')

export const SOCIAL_SAME_AS = SOCIAL_LINKS.map((link) => link.href)
