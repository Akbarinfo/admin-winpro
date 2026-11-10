import type { GroupType } from './types'

/**
 * The four product sections share one list, form and price panel; what differs is here.
 * `key` is the URL segment (/product/<key>) and the prefix of the table's URL params.
 */
export type ProductGroup = {
  key: string
  groupType: GroupType
  /** i18n keys */
  title: string
  addLabel: string
  /** List columns that only some groups have. */
  columns: { series: boolean; usefulPiece: boolean; wastePercent: boolean }
  /** List filters that only some groups have. */
  filters: { series: boolean; profileSystem: boolean }
}

export const PROFILE_GROUP: ProductGroup = {
  key: 'profile',
  groupType: 'PROFILES',
  title: 'product.profile.title',
  addLabel: 'product.profile.add',
  columns: { series: true, usefulPiece: true, wastePercent: true },
  filters: { series: true, profileSystem: true },
}

export const PRODUCT_GROUPS = [PROFILE_GROUP]

export const groupPath = (group: ProductGroup) => `/product/${group.key}`
