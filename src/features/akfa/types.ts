/** /v1/akfa lists: { data, total, page, size } (page from 1). */
export type HubPage<T> = { data: T[]; total: number; page?: number; size?: number }

/** GET /v1/akfa/summary. Mapped, ignored and new-product counts aren't in it (asked separately). */
export type AkfaSummary = {
  listenerRunning?: boolean
  lastMessageAt?: string | null
  unmappedCount?: number | null
  pendingPriceCount?: number | null
  needsReviewCount?: number | null
  priceErrorCount?: number | null
  unsupportedPriceCount?: number | null
}

/** An Akfa product (GET /v1/akfa/products). */
export type AkfaProduct = {
  id: number
  externalId?: string | number | null
  externalStatus?: string | null
  name: string
  groupName?: string | null
  unitName?: string | null
  currentRate?: number | null
  currentRateCurrency?: string | null
  currentRateDate?: string | null
  isNew?: boolean | null
  firstSeenAt?: string | null
  externalCreatedDate?: string | null
}

/** A WinPro position (product + texture) from /v1/akfa/positions/search. */
export type AkfaPosition = {
  productId: number
  productName: string
  article?: string | null
  textureId: number
  textureName: string
  price?: number | null
  currencySymbol?: string | null
  /** Already linked to another Akfa product: can't be chosen here. */
  mappedToAkfaProductId?: number | null
  mappedToAkfaName?: string | null
  /** Added from «all textures»: the search shows only positions with a price. */
  withoutPrice?: boolean
}

/** A link made by POST /products/{id}/map, with its price state. */
export type SavedMapping = {
  id: number
  productName?: string | null
  textureName?: string | null
  priceStatus?: string | null
  pendingPrice?: number | null
  pendingCurrencySymbol?: string | null
  pendingBasePrice?: number | null
  pendingBaseCurrencySymbol?: string | null
}

/** GET /products/{id}/product-draft: a new WinPro product guessed from the Akfa one. */
export type ProductDraft = Partial<{
  name: string
  article: string
  articleGroupType: string
  length: number
  unitId: number
  supplierId: number
  productSeriesId: number
  textureId: number
  textureIds: number[]
}>

/** POST /products/ignore. */
export type IgnoreResult = {
  ignored?: number[] | null
  skipped?: { id: number; reason: string }[] | null
}
