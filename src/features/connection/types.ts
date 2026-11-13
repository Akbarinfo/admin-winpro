/** A row of POST /v1/connection/table and GET /v1/connection/{id}: two products joined. */
export type Connection = {
  id: number
  product1?: number | null
  product2?: number | null
  article1?: string | null
  article2?: string | null
  product1Name?: string | null
  product2Name?: string | null
}

/** A variant of a connection (POST /v1/connection/type/table). */
export type ConnectionType = {
  id: number
  name?: string | null
  priority?: number | null
  /** The icon's id: /v1/file/connection/{connectionTypeIndex}. */
  connectionTypeIndex?: number | null
  isDefault?: boolean | null
}

/** An icon a variant can take (GET /v1/connection/type/enum/connection/type). */
export type ConnectionIcon = { id: number; name?: string | null }

/** A product of a variant's specification (POST /v1/connection/specification/table). */
export type ConnectionSpecification = {
  id: number
  productId?: number | null
  textureId?: number | null
  article?: string | null
  productName?: string | null
  textureName?: string | null
  supplierName?: string | null
}
