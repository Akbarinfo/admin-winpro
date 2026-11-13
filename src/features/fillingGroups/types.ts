/** A filling group (POST /v1/filling/group/table, GET /v1/filling/group/{id}). */
export type FillingGroup = {
  id: number
  name?: string | null
  clearance?: number | null
  outer?: boolean | null
  inner?: boolean | null
}

/** A product of a group's specification (POST /v1/filling/specification/group/table). */
export type FillingSpecification = {
  id: number
  thickness?: number | null
  productId?: number | null
  textureId?: number | null
  article?: string | null
  productName?: string | null
  textureName?: string | null
  supplierName?: string | null
}
