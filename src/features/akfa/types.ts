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

/** A link of a WinPro position to an Akfa product, with its pending price (GET /v1/akfa/mappings). */
export type AkfaMapping = {
  id: number
  productId?: number | null
  productName?: string | null
  article?: string | null
  textureId?: number | null
  textureName?: string | null
  akfaProductId?: number | null
  akfaProductName?: string | null
  groupName?: string | null
  /** The WinPro price now, and the one Akfa's rate gives. */
  pendingBasePrice?: number | null
  pendingBaseCurrencySymbol?: string | null
  pendingPrice?: number | null
  pendingCurrencySymbol?: string | null
  priceDeltaPercent?: number | null
  priceStatus?: string | null
  priceError?: string | null
  pendingSince?: string | null
  lastAppliedAt?: string | null
  lastAppliedPrice?: number | null
  lastAppliedBy?: string | null
  /** The WinPro price was changed some other way since: approving needs `force`. */
  stale?: boolean | null
}

/** PUT …/bulk-approve-price, …/bulk-reject-price. */
export type BulkResult = {
  processed?: number[] | null
  skipped?: { id: number; reason: string }[] | null
}

/** An inbound message from Akfa's queue (GET /v1/akfa/messages). */
export type AkfaMessage = {
  id: number
  receivedAt?: string | null
  processedAt?: string | null
  messageType?: string | null
  queue?: string | null
  itemCount?: number | null
  failedCount?: number | null
  status?: string | null
  attempts?: number | null
  error?: string | null
  /** The message itself (JSON text or an object), in the detail only. */
  body?: unknown
}
