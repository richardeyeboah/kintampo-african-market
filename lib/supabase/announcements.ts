import { createClientOptional } from '@/lib/supabase/server'
import { FREE_STANDARD_SHIPPING_SUBTOTAL } from '@/lib/shipping'
import { STORE } from '@/lib/constants/store'

export type AnnouncementMessage = {
  id: string
  text: string
  href?: string | null
}

const FALLBACK: AnnouncementMessage[] = [
  {
    id: 'fallback-0',
    text: `Nationwide shipping · Free standard on $${FREE_STANDARD_SHIPPING_SUBTOTAL}+ · Pickup in Columbus`,
  },
  {
    id: 'fallback-1',
    text: 'Mobile market & Ohio delivery — call the store',
    href: '/#mobile-market',
  },
  {
    id: 'fallback-2',
    text: 'Insurance, notary & more services — by appointment',
    href: '/#services',
  },
  {
    id: 'fallback-3',
    text: `Store pickup · ${STORE.address}`,
  },
]

export async function fetchAnnouncements(): Promise<AnnouncementMessage[]> {
  try {
    const supabase = await createClientOptional()
    if (!supabase) return FALLBACK
    const { data, error } = await supabase
      .from('site_announcements')
      .select('id, message, href, sort_order')
      .eq('active', true)
      .order('sort_order', { ascending: true })
    if (error || !data?.length) return FALLBACK
    return data.map((row) => ({
      id: row.id as string,
      text: String(row.message ?? ''),
      href: (row.href as string | null) ?? null,
    })).filter((m) => m.text.trim())
  } catch {
    return FALLBACK
  }
}
