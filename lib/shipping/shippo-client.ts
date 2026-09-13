import type { DefaultParcel, ShipFromAddress } from '@/lib/shipping/label-config'

export type ShippoLabelResult = {
  trackingNumber: string
  postage: number
  mailClass: string
  pdf: Buffer
  labelUrl: string
  metadata: Record<string, unknown>
}

function getToken(): string {
  const token = process.env.SHIPPO_API_TOKEN?.trim()
  if (!token) throw new Error('SHIPPO_API_TOKEN is not configured.')
  return token
}

export function isShippoConfigured(): boolean {
  return Boolean(process.env.SHIPPO_API_TOKEN?.trim())
}

export function isShippoTestMode(): boolean {
  const token = process.env.SHIPPO_API_TOKEN?.trim() ?? ''
  return token.startsWith('shippo_test_')
}

async function shippoRequest<T>(method: 'GET' | 'POST' | 'DELETE', path: string, body?: unknown): Promise<T> {
  const res = await fetch(`https://api.goshippo.com${path}`, {
    method,
    headers: {
      Authorization: `ShippoToken ${getToken()}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) {
    return undefined as T
  }

  const json = (await res.json()) as T & { message?: string; detail?: string }

  if (!res.ok) {
    const msg =
      (json as { message?: string; detail?: string }).message ??
      (json as { message?: string; detail?: string }).detail ??
      `Shippo API error (${res.status})`
    throw new Error(msg)
  }

  return json
}

export async function shippoPost<T>(path: string, body: unknown): Promise<T> {
  return shippoRequest<T>('POST', path, body)
}

export async function shippoGet<T>(path: string): Promise<T> {
  return shippoRequest<T>('GET', path)
}

export async function getShippoDomesticRate(input: {
  fromZip: string
  toZip: string
  parcel: DefaultParcel
}): Promise<{ price: number; mailClass: string; description: string } | null> {
  const shipment = await shippoPost<{
    rates?: Array<{
      amount?: string
      servicelevel?: { token?: string; name?: string }
      provider?: string
    }>
  }>('/shipments', {
    address_from: { zip: input.fromZip, country: 'US' },
    address_to: { zip: input.toZip, country: 'US' },
    parcels: [
      {
        weight: String(input.parcel.weightLb),
        length: String(input.parcel.lengthIn),
        width: String(input.parcel.widthIn),
        height: String(input.parcel.heightIn),
        distance_unit: 'in',
        mass_unit: 'lb',
      },
    ],
    async: false,
  })

  const uspsRates = (shipment.rates ?? []).filter((r) =>
    r.provider?.toUpperCase().includes('USPS')
  )

  const ground = uspsRates.find((r) =>
    r.servicelevel?.token?.toUpperCase().includes('GROUND')
  ) ?? uspsRates[0]

  if (!ground || !ground.amount) return null

  return {
    price: parseFloat(ground.amount),
    mailClass: ground.servicelevel?.token ?? 'usps_ground_advantage',
    description: ground.servicelevel?.name ?? 'USPS Ground Advantage',
  }
}

export async function createShippoDomesticLabel(input: {
  from: ShipFromAddress
  to: {
    name: string
    street1: string
    city: string
    state: string
    zip: string
    email?: string | null
    phone?: string | null
  }
  parcel: DefaultParcel
  /** Shown in Shippo dashboard / packing references (e.g. LQ-1042). */
  orderReference?: string | null
}): Promise<ShippoLabelResult> {
  type TransactionResponse = {
    tracking_number?: string
    label_url?: string
    commercial_invoice_url?: string
    status?: string
    messages?: Array<{ text?: string }>
    rate?: {
      amount?: string
      servicelevel?: { token?: string; name?: string }
    }
  }

  const toEmail = input.to.email?.trim() || undefined
  const toPhone = input.to.phone?.trim() || undefined
  const orderRef = input.orderReference?.trim() || undefined

  // First create a shipment to get live rates, then purchase the cheapest USPS ground rate.
  // Recipient email is required for Shippo's optional tracking emails (if enabled in Shippo).
  const shipment = await shippoPost<{
    object_id?: string
    rates?: Array<{
      object_id?: string
      amount?: string
      provider?: string
      servicelevel?: { token?: string; name?: string }
    }>
  }>('/shipments', {
    address_from: {
      name: input.from.name,
      street1: input.from.street1,
      street2: input.from.street2 ?? '',
      city: input.from.city,
      state: input.from.state,
      zip: input.from.zip,
      country: input.from.country,
      phone: input.from.phone,
      email: input.from.email,
    },
    address_to: {
      name: input.to.name,
      street1: input.to.street1,
      city: input.to.city,
      state: input.to.state,
      zip: input.to.zip,
      country: 'US',
      ...(toEmail ? { email: toEmail } : {}),
      ...(toPhone ? { phone: toPhone } : {}),
    },
    parcels: [
      {
        weight: String(input.parcel.weightLb),
        length: String(input.parcel.lengthIn),
        width: String(input.parcel.widthIn),
        height: String(input.parcel.heightIn),
        distance_unit: 'in',
        mass_unit: 'lb',
      },
    ],
    ...(orderRef
      ? {
          metadata: orderRef,
          extra: { reference_1: orderRef },
        }
      : {}),
    async: false,
  })

  const uspsRates = (shipment.rates ?? []).filter((r) =>
    r.provider?.toUpperCase().includes('USPS')
  )
  const chosenRate =
    uspsRates.find((r) => r.servicelevel?.token?.toUpperCase().includes('GROUND')) ??
    uspsRates[0] ??
    shipment.rates?.[0]

  if (!chosenRate?.object_id) {
    throw new Error('No USPS rate available for this shipment.')
  }

  const transaction = await shippoPost<TransactionResponse>('/transactions', {
    rate: chosenRate.object_id,
    label_file_type: 'PDF_4x6',
    async: false,
  })

  if (transaction.status !== 'SUCCESS' || !transaction.tracking_number || !transaction.label_url) {
    const errMsg =
      transaction.messages?.map((m) => m.text).filter(Boolean).join('; ') ??
      'Shippo label creation failed.'
    throw new Error(errMsg)
  }

  // Download the PDF label
  const labelRes = await fetch(transaction.label_url)
  if (!labelRes.ok) throw new Error('Could not download label PDF from Shippo.')
  const pdf = Buffer.from(await labelRes.arrayBuffer())

  const postage = transaction.rate?.amount ? parseFloat(transaction.rate.amount) : 0
  const mailClass = transaction.rate?.servicelevel?.token ?? 'usps_ground_advantage'

  return {
    trackingNumber: transaction.tracking_number,
    postage,
    mailClass,
    pdf,
    labelUrl: transaction.label_url,
    metadata: transaction as unknown as Record<string, unknown>,
  }
}
