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

/** GET /v1/product/{id} — the fields the profile form uses. */
export type ProductDetail = {
  id: number
  name: string
  nameInCatalog?: string | null
  article?: string | null
  profileType?: string | null
  productSeriesId?: number | null
  productSeriesName?: string | null
  unitId?: number | null
  unitName?: string | null
  supplierId?: number | null
  supplierName?: string | null
  length?: number | null
  width?: number | null
  thickness?: number | null
  sizeB?: number | null
  sizeN?: number | null
  sizeF?: number | null
  trackCount?: number | null
  sashClearance?: number | null
  comeIn?: number | null
  articleSpecificWeight?: number | null
  sectionArea?: number | null
  momentJx?: number | null
  momentJy?: number | null
  usefulPiece?: number | null
  wastePercent?: number | null
  isReinforced?: boolean | null
  needCuttingOptimization?: boolean | null
  isArcProfile?: boolean | null
  drawingId?: number | null
}

/** Names of the chosen series, unit and supplier — the old form sent them next to the ids. */
export type ChosenNames = { productSeriesName: string; unitName: string; supplierName: string }
