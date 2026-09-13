import { NextRequest, NextResponse } from 'next/server'

/** Treat `example.com` and `www.example.com` as the same host (common apex/www split on Vercel). */
function canonicalComparableHost(host: string): string {
  const h = host.toLowerCase()
  return h.startsWith('www.') ? h.slice(4) : h
}

function hostsMatch(requestHost: string, candidateHost: string): boolean {
  const a = canonicalComparableHost(requestHost)
  const b = canonicalComparableHost(candidateHost)
  return a === b
}

/**
 * Lightweight CSRF defense: ensure the request originates from this site.
 *
 * Browsers usually send `Origin` or `Referer` on state-changing requests from real pages.
 * Some environments omit both (extensions, privacy settings); modern browsers send
 * `Sec-Fetch-Site: same-origin` for same-origin fetch, which cross-site attackers cannot spoof.
 */
export function assertSameOrigin(
  req: NextRequest
): { ok: true } | { ok: false; response: NextResponse } {
  const host = req.headers.get('host')
  if (!host) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Missing host header.' }, { status: 400 }),
    }
  }

  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')
  const candidate = origin ?? referer

  if (candidate) {
    let candidateHost: string
    try {
      candidateHost = new URL(candidate).host
    } catch {
      return {
        ok: false,
        response: NextResponse.json({ error: 'Invalid origin header.' }, { status: 400 }),
      }
    }

    if (!hostsMatch(host, candidateHost)) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'Cross-site request blocked.' }, { status: 403 }),
      }
    }

    return { ok: true }
  }

  const secFetchSite = req.headers.get('sec-fetch-site')
  if (secFetchSite === 'same-origin') {
    return { ok: true }
  }

  return {
    ok: false,
    response: NextResponse.json({ error: 'Cross-site request blocked.' }, { status: 403 }),
  }
}
