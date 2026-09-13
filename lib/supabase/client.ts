import { createBrowserClient } from '@supabase/ssr'
import { getSupabasePublicConfig } from '@/lib/supabase/config'

export function isSupabaseBrowserConfigured(): boolean {
  return getSupabasePublicConfig().configured
}

export function createClient() {
  const { url, anonKey, configured } = getSupabasePublicConfig()
  if (!configured) {
    throw new Error('Supabase is not configured in this environment.')
  }
  return createBrowserClient(url, anonKey)
}
