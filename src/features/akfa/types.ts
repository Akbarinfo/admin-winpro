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

/** A WinPro product in the mapping tab (GET /v1/akfa/winpro-products). */
export type WinproProduct = {
  productId: number
  productName?: string | null
  article?: string | null
  unitName?: string | null
  articleGroupType?: string | null
  supplierName?: string | null
  productSeriesName?: string | null
  price?: number | null
  currencySymbol?: string | null
  hasPrice?: boolean | null
  mappedTextureCount?: number | null
  totalTextureCount?: number | null
}

/** A texture of a WinPro product and the Akfa product it's linked to (…/texture-options). */
export type TextureOption = {
  textureId: number
  textureName?: string | null
  priceOne?: number | null
  price?: number | null
  currencySymbol?: string | null
  currency?: string | null
  mappedToAkfaProductId?: number | null
  mappedToAkfaName?: string | null
}

/** An Akfa product with the textures linked to it (GET /v1/akfa/mappings/akfa-products). */
export type MappingAkfaProduct = {
  id: number
  externalId?: string | number | null
  name?: string | null
  groupName?: string | null
  price?: number | null
  currency?: string | null
  linkedTextures?:
    | {
        productId: number
        productName?: string | null
        textureId: number
        textureName?: string | null
      }[]
    | null
}

/** One changed link for PUT /mappings/batch; `expected` is what it was when loaded. */
export type MappingChange = {
  productId: number
  textureId: number
  akfaProductId: number | null
  expectedAkfaProductId: number | null
}

/** 409 of the batch save or the Excel import: rows another admin changed meanwhile. */
export type MappingConflict = {
  productId: number
  textureId: number
  productName?: string | null
  textureName?: string | null
  currentAkfaProductName?: string | null
}

/** POST /mappings/import/excel (200, or 409 with conflicts and nothing saved). */
export type MappingImportResult = {
  total?: number | null
  applied?: number | null
  skipped?: number | null
  errors?:
    | {
        row: number
        productId?: number | null
        textureId?: number | null
        field?: string | null
        value?: string | null
        message: string
      }[]
    | null
  conflicts?: MappingConflict[] | null
}

/** GET /v1/akfa/unit-mappings: an Akfa dealer unit and the WinPro unit it stands for. */
export type AkfaUnitMapping = {
  id: number
  akfaUnitId: number
  akfaUnitName: string
  unitId?: number | null
  unitName?: string | null
  unitShortName?: string | null
}
