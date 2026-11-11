import type { AnyProductFormSpec } from './forms/types'
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
  /** The group's own product import and its example file (prices and translations are common). */
  excel: { upload: string; template: string }
  /** The group's own part of the form (forms/<group>.tsx), loaded with the form page. */
  loadForm: () => Promise<AnyProductFormSpec>
}

/** Imports every group shares. */
export const PRICE_EXCEL = {
  upload: '/v1/product/price/upload',
  template: '/v1/product/excel/example',
}

export const PROFILE_GROUP: ProductGroup = {
  key: 'profile',
  groupType: 'PROFILES',
  title: 'product.profile.title',
  addLabel: 'product.profile.add',
  columns: { series: true, usefulPiece: true, wastePercent: true },
  filters: { series: true, profileSystem: true },
  excel: {
    upload: '/v1/product/profiles/upload',
    template: '/v1/product/excel/profile/example',
  },
  loadForm: () => import('./forms/profile').then((m) => m.profileForm),
}

/** Seals: no series, no useful piece; a profile-system filter like profiles (layout/product/seal). */
export const SEAL_GROUP: ProductGroup = {
  key: 'seal',
  groupType: 'SEAL',
  title: 'product.seal.title',
  addLabel: 'product.seal.add',
  columns: { series: false, usefulPiece: false, wastePercent: false },
  filters: { series: false, profileSystem: true },
  excel: {
    upload: '/v1/product/seal/upload',
    template: '/v1/product/excel/seal/example',
  },
  loadForm: () => import('./forms/seal').then((m) => m.sealForm),
}

export const PRODUCT_GROUPS = [PROFILE_GROUP, SEAL_GROUP]

export const groupPath = (group: ProductGroup) => `/product/${group.key}`
