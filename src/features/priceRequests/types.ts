export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

/** A supplier's request to change a price: an item of GET /v1/price-requests. */
export type PriceRequest = {
  id: number
  productName?: string | null
  productArticle?: string | null
  supplierName?: string | null
  textureName?: string | null
  /** «#a8743d» */
  textureColor?: string | null
  currentPrice?: number | null
  requestedPrice?: number | null
  currencySymbol?: string | null
  createdDate?: string | null
  requestStatus: RequestStatus
}

/** One page: `total` is the count of all matching requests. */
export type PriceRequestPage = { data: PriceRequest[]; total: number }
