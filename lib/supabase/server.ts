import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getSupabasePublicConfig, SupabaseConfigError } from '@/lib/supabase/config'

/** Returns null when public Supabase env vars are missing (safe during static build). */
export async function createClientOptional(): Promise<SupabaseClient | null> {
  const { url, anonKey, configured } = getSupabasePublicConfig()
  if (!configured) return null

  const cookieStore = await cookies()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Server Component — ignore if read-only
        }
      },
    },
  })
}

export async function createClient(): Promise<SupabaseClient> {
  const client = await createClientOptional()
  if (!client) throw new SupabaseConfigError()
  return client
}
