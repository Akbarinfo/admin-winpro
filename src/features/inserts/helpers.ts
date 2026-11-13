import type { Consist } from './types'

/** «Article - Supplier - Product», as the old page's title. */
export const consistLabel = (c: Pick<Consist, 'article' | 'supplierName' | 'productName'>) =>
  [c.article, c.supplierName, c.productName].filter(Boolean).join(' - ')
