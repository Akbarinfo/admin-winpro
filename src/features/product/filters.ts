import type { FilterSchema } from '@/shared/hooks/tableFilters'

/** The old panel's list filters; sent in the table body's `filter` together with `groupType`. */
export const PRODUCT_FILTERS = {
  searchTxt: 'string',
  type: 'string',
  supplierId: 'number',
  productSeriesId: 'number',
  profileSystemId: 'number',
  hasPriceWarning: 'boolean',
} as const satisfies FilterSchema
