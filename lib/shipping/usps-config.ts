import { getDefaultParcel, getShipFromAddress } from '@/lib/shipping/label-config'

function trim(v: string | undefined): string {
  return v?.trim() ?? ''
}

export type UspsApiConfig = {
  baseUrl: string
  clientId: string
  clientSecret: string
  epsAccountNumber: string
  crid: string
  mid: string
  manifestMid: string
  accountType: 'EPS' | 'PERMIT'
  permitZip?: string
  mailClass: string
}

export function getUspsApiBaseUrl(): string {
  if (trim(process.env.USPS_API_BASE_URL)) {
    return trim(process.env.USPS_API_BASE_URL).replace(/\/$/, '')
  }
  return process.env.USPS_API_USE_TEST === '1'
    ? 'https://apis-tem.usps.com'
    : 'https://apis.usps.com'
}

export function getUspsApiConfig(): UspsApiConfig | null {
  const clientId = trim(process.env.USPS_API_CLIENT_ID)
  const clientSecret = trim(process.env.USPS_API_CLIENT_SECRET)
  const epsAccountNumber = trim(process.env.USPS_EPS_ACCOUNT_NUMBER)
  const crid = trim(process.env.USPS_CRID)
  const mid = trim(process.env.USPS_MID)

  if (!clientId || !clientSecret || !epsAccountNumber || !crid || !mid) {
    return null
  }

  const accountTypeRaw = trim(process.env.USPS_ACCOUNT_TYPE).toUpperCase()
  const accountType = accountTypeRaw === 'PERMIT' ? 'PERMIT' : 'EPS'

  return {
    baseUrl: getUspsApiBaseUrl(),
    clientId,
    clientSecret,
    epsAccountNumber,
    crid,
    mid,
    manifestMid: trim(process.env.USPS_MANIFEST_MID) || mid,
    accountType,
    permitZip: trim(process.env.USPS_PERMIT_ZIP) || undefined,
    mailClass: trim(process.env.USPS_MAIL_CLASS) || 'USPS_GROUND_ADVANTAGE',
  }
}

export function isUspsConfigured(): boolean {
  return getUspsApiConfig() !== null && getShipFromAddress() !== null
}

export function getUspsConfigPublic() {
  const cfg = getUspsApiConfig()
  const from = getShipFromAddress()
  return {
    uspsConfigured: isUspsConfigured(),
    hasCredentials: Boolean(cfg),
    hasShipFrom: from !== null,
    mailClass: cfg?.mailClass ?? 'USPS_GROUND_ADVANTAGE',
    useTestApi: process.env.USPS_API_USE_TEST === '1',
    defaultParcel: getDefaultParcel(),
  }
}
