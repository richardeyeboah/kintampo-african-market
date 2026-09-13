import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getSupabasePublicConfig } from '@/lib/supabase/config'

/** Read-only Supabase client for sitemap/catalog (no cookies — safe in metadata routes). */
export function createCatalogClient(): SupabaseClient | null {
  const { url, anonKey, configured } = getSupabasePublicConfig()
  if (!configured) return null
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
