/** A row of /v1/sale-categories/table. */
export type SalesCategoryRow = {
  id: number
  name: string
  price?: number | null
  currencyName?: string | null
  /** Tariffs for which this category is free */
  freeForTariffs?: string[] | null
}

/** A sales category as returned by GET /v1/sale-categories/:id. */
export type SalesCategory = {
  id: number
  name: string
  description?: string | null
  price?: number | null
  currencyId?: number | null
  freeForTariffs?: string[] | null
  profileSystemIds?: number[] | null
}
