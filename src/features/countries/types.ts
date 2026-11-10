/** A country as returned by /v1/country/list and GET /v1/country/:id. */
export type CountryRecord = {
  id: number
  name: string
  /** ISO code, «uz» */
  code: string
  /** «+998» */
  phoneCode?: string | null
  /** «+998 (##) ### ## ##» — `#` is a digit */
  phoneFormat?: string | null
  /** Digits after the code: 9 for UZ */
  digitsLength?: number | null
  /** Full number length with the code */
  length?: number | null
  /** Regex that cuts the code off a number: «/^\+998/» */
  codeSlice?: string | null
  currencyId?: number | null
  currencyName?: string | null
  currency?: { id: number; name: string } | null
  /** MinIO bucket for this country's files; empty — the shared one */
  storageBucket?: string | null
  isActive?: boolean | null
  isDefault?: boolean | null
  flagUrl?: string | null
}

/** How users of a country get codes (login, reset): /v1/country-provider. */
export type CountryProvider = {
  id: number
  provider: string
  sortOrder: number
  isActive: boolean
  countryId?: number
}

export const PROVIDERS = ['SMS', 'TELEGRAM', 'WHATSAPP', 'EMAIL']
