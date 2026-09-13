import { getUspsApiBaseUrl, getUspsApiConfig } from '@/lib/shipping/usps-config'

export type UspsOAuthCredentials = {
  baseUrl: string
  clientId: string
  clientSecret: string
}

type TokenCache = {
  token: string
  expiresAt: number
  grantedScope: string
}

const oauthCaches = new Map<string, TokenCache>()

export function getUspsOAuthCredentials(): UspsOAuthCredentials | null {
  const cfg = getUspsApiConfig()
  if (cfg) {
    return { baseUrl: cfg.baseUrl, clientId: cfg.clientId, clientSecret: cfg.clientSecret }
  }
  const clientId = process.env.USPS_API_CLIENT_ID?.trim()
  const clientSecret = process.env.USPS_API_CLIENT_SECRET?.trim()
  if (!clientId || !clientSecret) return null
  return { baseUrl: getUspsApiBaseUrl(), clientId, clientSecret }
}

export function isUspsAddressApiConfigured(): boolean {
  return getUspsOAuthCredentials() !== null
}

const DEFAULT_SCOPES = 'addresses'

/** OAuth scope names differ from API path names — `payments` is not a valid scope. */
function normalizeUspsScopes(scopes: string): string {
  const parts = scopes
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => {
      if (s === 'prices') return 'domestic-prices'
      if (s === 'payments') return null
      return s
    })
    .filter((s): s is string => Boolean(s))

  return [...new Set(parts)].join(' ')
}

function grantedScopeIncludes(granted: string, required: string): boolean {
  const parts = granted.toLowerCase().split(/\s+/)
  return parts.includes(required.toLowerCase())
}

function scopeSatisfied(granted: string, requested: string): boolean {
  const needed = normalizeUspsScopes(requested).split(/\s+/).filter(Boolean)
  if (needed.length === 0) return true
  return needed.every((s) => grantedScopeIncludes(granted, s))
}

function scopeHelpMessage(requested: string): string {
  const needLabels = requested.includes('labels')
  const needPrices = requested.includes('domestic-prices') || requested.includes('prices')
  const parts: string[] = ['USPS OAuth scope is missing for this action.']
  if (needLabels) {
    parts.push(
      'Request Labels API access from apisupport@usps.gov (not available as a self-service toggle).'
    )
  }
  if (needPrices) {
    parts.push(
      'Your app needs Domestic Prices on the default Public Access product — email apisupport@usps.gov if rate quotes fail.'
    )
  }
  parts.push(`Requested: ${requested}`)
  return parts.join(' ')
}

async function fetchOAuthToken(
  creds: UspsOAuthCredentials,
  scopeParam: string | null
): Promise<{ access_token: string; expires_in?: number; scope?: string }> {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
  })
  if (scopeParam) body.set('scope', scopeParam)

  const res = await fetch(`${creds.baseUrl}/oauth2/v3/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const json = (await res.json().catch(() => ({}))) as {
    access_token?: string
    expires_in?: number
    scope?: string
    error_description?: string
    message?: string
  }

  if (!res.ok || !json.access_token) {
    const raw = json.error_description ?? json.message ?? 'Could not authenticate with USPS API.'
    if (/invalid.*scope/i.test(raw) && scopeParam) {
      throw new Error(scopeHelpMessage(scopeParam))
    }
    throw new Error(raw)
  }

  return {
    access_token: json.access_token,
    expires_in: json.expires_in,
    scope: typeof json.scope === 'string' ? json.scope : scopeParam ?? '',
  }
}

export async function getUspsOAuthToken(
  scopes: string = DEFAULT_SCOPES
): Promise<string> {
  const creds = getUspsOAuthCredentials()
  if (!creds) {
    throw new Error('USPS API credentials are not configured.')
  }

  const scopeKey = normalizeUspsScopes(scopes)
  if (!scopeKey) {
    throw new Error('No valid USPS OAuth scopes requested.')
  }

  const now = Date.now()
  const cached = oauthCaches.get(scopeKey)
  if (cached && cached.expiresAt > now + 60_000 && scopeSatisfied(cached.grantedScope, scopeKey)) {
    return cached.token
  }

  let tokenResponse: { access_token: string; expires_in?: number; scope?: string }
  try {
    tokenResponse = await fetchOAuthToken(creds, scopeKey)
  } catch (firstError) {
    // Only retry without scope when a single scope was requested and it was rejected.
    if (!/invalid.*scope/i.test(firstError instanceof Error ? firstError.message : '')) {
      throw firstError
    }
    tokenResponse = await fetchOAuthToken(creds, null)
  }

  const grantedScope = tokenResponse.scope ?? ''
  if (!scopeSatisfied(grantedScope, scopeKey)) {
    throw new Error(scopeHelpMessage(scopeKey))
  }

  oauthCaches.set(scopeKey, {
    token: tokenResponse.access_token,
    expiresAt: now + (tokenResponse.expires_in ?? 28_800) * 1000,
    grantedScope,
  })
  return tokenResponse.access_token
}

export function resetUspsOAuthCache(scopeKey?: string): void {
  if (scopeKey) {
    oauthCaches.delete(normalizeUspsScopes(scopeKey))
    return
  }
  oauthCaches.clear()
}
