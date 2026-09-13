export type AddressInput = {
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

export type ParsedAddress = {
  line1: string
  city: string
  state: string
  country: string
  postalCode: string
}

export type AddressSuggestion = {
  id: string
  primary: string
  secondary: string
  parsed: ParsedAddress
  /** Google Places ID — required for verified selection when Google is enabled. */
  placeId?: string
  source: 'google' | 'geoapify' | 'photon'
}
