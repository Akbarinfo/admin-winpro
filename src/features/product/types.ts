/** Product groups as the backend names them (`groupType`). */
export type GroupType = 'PROFILES' | 'ACCESSORIES' | 'SEAL' | 'FILLINGS'

/** A row of POST /v1/product/table. */
export type ProductRow = {
  id: number
  name: string
  nameInCatalog?: string | null
  article?: string | null
  /** Article type: an enum value (FRAME, SASH…) translated by the legacy keys. */
  profileType?: string | null
  supplierName?: string | null
  unitName?: string | null
  productSeriesName?: string | null
  usefulPiece?: number | null
  wastePercent?: number | null
  /** Some price of the product looks wrong — the list marks it. */
  hasPriceWarning?: boolean | null
}

/** An item of /v1/product/enum/article/type/{groupType}; `name` is the enum value. */
export type ArticleType = { id: number | string; name: string }
