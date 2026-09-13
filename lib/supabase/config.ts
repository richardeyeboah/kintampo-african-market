/**
 * Single source of truth for Supabase public env (browser + server).
 * Values must be set in Vercel for Production, Preview, and Development.
 */
export type SupabasePublicConfig = {
  url: string
  anonKey: string
  configured: boolean
}

export function getSupabasePublicConfig(): SupabasePublicConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? ''
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? ''
  return {
    url,
    anonKey,
    configured: url.length > 0 && anonKey.length > 0,
  }
}

export class SupabaseConfigError extends Error {
  constructor() {
    super('The store catalog is temporarily unavailable. Please try again shortly.')
    this.name = 'SupabaseConfigError'
  }
}

/** Customer-safe message — never show raw fetch / TypeError text. */
export function formatCatalogError(error: { message?: string } | null, configured: boolean): string {
  if (!configured) {
    return 'Our online catalog is temporarily unavailable. Please call (614) 377-8297, (614) 325-7385, or (614) 323-7385 or visit us at 1668 E Dublin Granville Rd, Columbus, OH.'
  }
  const msg = error?.message ?? ''
  if (/fetch failed|ECONNREFUSED|ENOTFOUND|network/i.test(msg)) {
    return 'We could not reach our product database just now. Please refresh the page or try again in a minute.'
  }
  if (/JWT|Invalid API key|apikey/i.test(msg)) {
    return 'Store connection is misconfigured. Please contact the shop — we are fixing it.'
  }
  return 'Something went wrong loading products. Please refresh or try again shortly.'
}
