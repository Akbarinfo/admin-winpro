export const FEATURE_TYPES = ['BOOLEAN', 'TEXT'] as const
export type FeatureType = (typeof FEATURE_TYPES)[number]

/** A line of a tariff's feature list, as returned by /v1/tariff-feature. */
export type TariffFeature = {
  id: number
  /** Tariff name from /v1/tariff-price/tariffs */
  tariff: string
  featureKey: string
  featureLabel?: string | null
  value: string
  featureType: FeatureType | string
  unit?: string | null
  sortOrder: number
}
