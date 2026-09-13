import type { DefaultParcel, ShipFromAddress } from '@/lib/shipping/label-config'
import { parseUspsLabelMultipart } from '@/lib/shipping/parse-multipart'
import { parsePersonName } from '@/lib/shipping/parse-person-name'
import { getUspsApiConfig, type UspsApiConfig } from '@/lib/shipping/usps-config'
import { getUspsOAuthToken, resetUspsOAuthCache } from '@/lib/shipping/usps-oauth'

const RATES_SCOPE = 'domestic-prices'
const LABELS_SCOPE = 'labels'

export type UspsLabelResult = {
  trackingNumber: string
  postage: number
  mailClass: string
  pdf: Buffer
  metadata: Record<string, unknown>
}

type TokenCache = {
  token: string
  expiresAt: number
}

let paymentCache: TokenCache | null = null

function zip5(zip: string): string {
  return zip.trim().slice(0, 5)
}

function mailingDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function paymentRole(cfg: UspsApiConfig, roleName: 'PAYER' | 'LABEL_OWNER') {
  const role: Record<string, string> = {
    roleName,
    CRID: cfg.crid,
    MID: cfg.mid,
    manifestMID: cfg.manifestMid,
    accountType: cfg.accountType,
    accountNumber: cfg.epsAccountNumber,
  }
  if (cfg.accountType === 'PERMIT' && cfg.permitZip) {
    role.permitZIPCode = cfg.permitZip
  }
  return role
}

async function uspsJson<T>(
  cfg: UspsApiConfig,
  path: string,
  init: RequestInit & { bearer?: string; paymentToken?: string }
): Promise<{ data: T; contentType: string; buffer: Buffer }> {
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  }
  if (init.bearer) headers.Authorization = `Bearer ${init.bearer}`
  if (init.paymentToken) headers['X-Payment-Authorization-Token'] = init.paymentToken

  const res = await fetch(`${cfg.baseUrl}${path}`, { ...init, headers })
  const buffer = Buffer.from(await res.arrayBuffer())
  const contentType = res.headers.get('content-type') ?? ''

  if (!res.ok) {
    let message = `USPS API error (${res.status})`
    if (contentType.includes('json')) {
      try {
        const err = JSON.parse(buffer.toString('utf8')) as { error?: { message?: string }; message?: string }
        message = err.error?.message ?? err.message ?? message
      } catch {
        /* ignore */
      }
    } else if (buffer.length > 0 && buffer.length < 2000) {
      message = buffer.toString('utf8').trim() || message
    }
    const err = new Error(message) as Error & { status?: number }
    err.status = res.status
    throw err
  }

  if (contentType.includes('json')) {
    return { data: JSON.parse(buffer.toString('utf8')) as T, contentType, buffer }
  }

  return { data: {} as T, contentType, buffer }
}

async function getRatesOAuthToken(): Promise<string> {
  return getUspsOAuthToken(RATES_SCOPE)
}

async function getLabelsOAuthToken(): Promise<string> {
  return getUspsOAuthToken(LABELS_SCOPE)
}

async function getPaymentToken(cfg: UspsApiConfig, bearer: string): Promise<string> {
  const now = Date.now()
  if (paymentCache && paymentCache.expiresAt > now + 60_000) {
    return paymentCache.token
  }

  const { data } = await uspsJson<{ paymentAuthorizationToken?: string }>(
    cfg,
    '/payments/v3/payment-authorization',
    {
      method: 'POST',
      bearer,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roles: [paymentRole(cfg, 'PAYER'), paymentRole(cfg, 'LABEL_OWNER')],
      }),
    }
  )

  if (!data.paymentAuthorizationToken) {
    throw new Error('USPS payment authorization failed.')
  }

  paymentCache = {
    token: data.paymentAuthorizationToken,
    expiresAt: now + 28_800_000,
  }
  return data.paymentAuthorizationToken
}

function toUspsAddress(from: ShipFromAddress) {
  const { firstName, lastName } = parsePersonName(from.name)
  return {
    firstName,
    lastName,
    streetAddress: from.street1,
    ...(from.street2 ? { secondaryAddress: from.street2 } : {}),
    city: from.city,
    state: from.state,
    ZIPCode: zip5(from.zip),
  }
}

function toUspsToAddress(input: {
  name: string
  street1: string
  city: string
  state: string
  zip: string
}) {
  const { firstName, lastName } = parsePersonName(input.name)
  return {
    firstName,
    lastName,
    streetAddress: input.street1,
    city: input.city,
    state: input.state,
    ZIPCode: zip5(input.zip),
  }
}

export async function getUspsDomesticRate(input: {
  fromZip: string
  toZip: string
  parcel: DefaultParcel
}): Promise<{ price: number; mailClass: string; description: string } | null> {
  const cfg = getUspsApiConfig()
  if (!cfg) return null

  const rateBody = JSON.stringify({
    originZIPCode: zip5(input.fromZip),
    destinationZIPCode: zip5(input.toZip),
    weight: input.parcel.weightLb,
    length: input.parcel.lengthIn,
    width: input.parcel.widthIn,
    height: input.parcel.heightIn,
    mailClass: cfg.mailClass,
    processingCategory: 'MACHINABLE',
    destinationEntryFacilityType: 'NONE',
    rateIndicator: 'SP',
    priceType: 'COMMERCIAL',
    accountType: cfg.accountType,
    accountNumber: cfg.epsAccountNumber,
    mailingDate: mailingDate(),
  })

  async function fetchRate(bearer: string) {
    return uspsJson<{
      totalBasePrice?: number
      rates?: Array<{ price?: number; mailClass?: string; description?: string }>
    }>(cfg!, '/prices/v3/base-rates/search', {
      method: 'POST',
      bearer,
      headers: { 'Content-Type': 'application/json' },
      body: rateBody,
    })
  }

  let bearer = await getRatesOAuthToken()
  let data: Awaited<ReturnType<typeof fetchRate>>['data']
  try {
    ;({ data } = await fetchRate(bearer))
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    const status = e && typeof e === 'object' && 'status' in e ? Number(e.status) : 0
    if (status === 401 && /insufficient oauth scope/i.test(msg)) {
      resetUspsOAuthCache(RATES_SCOPE)
      bearer = await getRatesOAuthToken()
      ;({ data } = await fetchRate(bearer))
    } else {
      throw e
    }
  }

  const rate = data.rates?.[0]
  const price = rate?.price ?? data.totalBasePrice
  if (price == null || !Number.isFinite(price)) return null

  return {
    price,
    mailClass: rate?.mailClass ?? cfg.mailClass,
    description: rate?.description ?? 'USPS Ground Advantage',
  }
}

export async function createUspsDomesticLabel(input: {
  from: ShipFromAddress
  to: {
    name: string
    street1: string
    city: string
    state: string
    zip: string
  }
  parcel: DefaultParcel
}): Promise<UspsLabelResult> {
  const cfg = getUspsApiConfig()
  if (!cfg) {
    throw new Error('USPS API is not configured.')
  }

  const bearer = await getLabelsOAuthToken()
  const paymentToken = await getPaymentToken(cfg, bearer)

  const { contentType, buffer } = await uspsJson<unknown>(cfg, '/labels/v3/label', {
    method: 'POST',
    bearer,
    paymentToken,
    headers: { 'Content-Type': 'application/json', Accept: 'multipart/form-data' },
    body: JSON.stringify({
      imageInfo: {
        imageType: 'PDF',
        labelType: '4X6LABEL',
        receiptOption: 'NONE',
        suppressPostage: false,
        suppressMailDate: false,
        returnLabel: false,
      },
      fromAddress: toUspsAddress(input.from),
      toAddress: toUspsToAddress(input.to),
      packageDescription: {
        mailClass: cfg.mailClass,
        rateIndicator: 'SP',
        weightUOM: 'lb',
        weight: input.parcel.weightLb,
        dimensionsUOM: 'in',
        length: input.parcel.lengthIn,
        width: input.parcel.widthIn,
        height: input.parcel.heightIn,
        processingCategory: 'MACHINABLE',
        mailingDate: mailingDate(),
        destinationEntryFacilityType: 'NONE',
      },
    }),
  })

  const { metadata, pdf } = parseUspsLabelMultipart(contentType, buffer)
  const trackingNumber = typeof metadata.trackingNumber === 'string' ? metadata.trackingNumber : ''
  if (!trackingNumber) {
    throw new Error('USPS did not return a tracking number.')
  }

  const postage = typeof metadata.postage === 'number' ? metadata.postage : 0

  return {
    trackingNumber,
    postage,
    mailClass: cfg.mailClass,
    pdf,
    metadata,
  }
}

/** Clear cached tokens (tests / credential rotation). */
export function resetUspsTokenCache(): void {
  resetUspsOAuthCache()
  paymentCache = null
}
