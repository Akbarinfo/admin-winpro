/** A supplier as returned by /v1/supplier. */
export type Supplier = {
  id: number
  name: string
  address?: string | null
  /** «+998(90) 123 - 45 - 67» */
  phone?: string | null
  country?: string | null
  currencyId?: number | null
  currencyName?: string | null
  /** Comma-separated enum values: «PROFILES, FITTINGS». */
  types?: string | null
  logoId?: number | null
}

/** An item of /v1/supplier/enum/supplier/type; `name` is the enum value, translated by the legacy keys. */
export type SupplierType = { id: number | string; name: string }

/** «PROFILES, FITTINGS» → ['PROFILES', 'FITTINGS'] */
export const parseTypes = (types: string | null | undefined) =>
  (types ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
