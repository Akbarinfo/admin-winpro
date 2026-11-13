/** A product with inserts (POST /v1/consist/table, GET /v1/consist/{id}). */
export type Consist = {
  id: number
  productId?: number | null
  productName?: string | null
  article?: string | null
  supplierName?: string | null
  [field: string]: unknown
}

/** An insert of a product (POST /v1/additional/table). */
export type Additional = {
  id: number
  name?: string | null
  byDefault?: boolean | null
  necessarily?: boolean | null
  consistId?: number | null
}

/** A product of an insert's specification (POST /v1/additional/specification/table). */
export type AdditionalSpecification = {
  id: number
  productId?: number | null
  textureId?: number | null
  article?: string | null
  productName?: string | null
  textureName?: string | null
  supplierName?: string | null
}
