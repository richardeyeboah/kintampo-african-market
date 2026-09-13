/**
 * Debug USPS rate API + OAuth scopes. Run:
 *   node --env-file=.env.local scripts/test-usps-rate-scope.mjs
 */
const id = process.env.USPS_API_CLIENT_ID?.trim()
const secret = process.env.USPS_API_CLIENT_SECRET?.trim()
const base =
  process.env.USPS_API_USE_TEST === '1' ? 'https://apis-tem.usps.com' : 'https://apis.usps.com'

if (!id || !secret) {
  console.error('Missing USPS_API_CLIENT_ID / SECRET')
  process.exit(1)
}

async function getToken(scope) {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: id,
    client_secret: secret,
  })
  if (scope) body.set('scope', scope)
  const res = await fetch(`${base}/oauth2/v3/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const json = await res.json()
  return { ok: res.ok, json }
}

async function tryRate(bearer, label) {
  const fromZip = process.env.SHIP_FROM_ZIP?.trim() || '43229'
  const body = {
    originZIPCode: fromZip.slice(0, 5),
    destinationZIPCode: '10001',
    weight: 3,
    length: 12,
    width: 10,
    height: 8,
    mailClass: 'USPS_GROUND_ADVANTAGE',
    processingCategory: 'MACHINABLE',
    destinationEntryFacilityType: 'NONE',
    rateIndicator: 'SP',
    priceType: 'COMMERCIAL',
    accountType: 'EPS',
    accountNumber: process.env.USPS_EPS_ACCOUNT_NUMBER?.trim(),
    mailingDate: new Date().toISOString().slice(0, 10),
  }
  const res = await fetch(`${base}/prices/v3/base-rates/search`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bearer}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  console.log(`  rate [${label}] ${res.status}:`, text.slice(0, 200))
}

console.log('base', base)
for (const scope of ['domestic-prices', 'prices', null]) {
  const { ok, json } = await getToken(scope)
  const label = scope ?? '(no scope param)'
  if (!ok) {
    console.log('token', label, 'FAIL', json.error_description || json.message)
    continue
  }
  console.log('token', label, 'OK granted:', json.scope)
  await tryRate(json.access_token, label)
}
