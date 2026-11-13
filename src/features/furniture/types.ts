/** A fitting set (POST /v1/accessories/table, GET /v1/accessories/{id}). */
export type Accessory = {
  id: number
  name?: string | null
  shortName?: string | null
  handleSide?: number | null
  maxHalfPerimeter?: number | null
  maxHeight?: number | null
  maxWidth?: number | null
  maxSash?: number | null
  accessoriesType?: string | null
  openingType?: string | null
  openingSide?: string | null
  door?: boolean | null
}

/** A value of an accessory enum (type, opening type, opening side, side function). */
export type EnumOption = { id: number; name: string }

/** A side of an accessory (GET /v1/accessories/side/{id}/list); edited as the whole row. */
export type AccessorySide = {
  id: number
  hangleSide?: string | number | null
  hangleSideFunc?: string | null
  [field: string]: unknown
}

/** A row of a main / track / dependent / inner specification. */
export type AccessorySpecification = {
  id: number
  productId?: number | null
  textureId?: number | null
  article?: string | null
  productName?: string | null
  textureName?: string | null
  supplierName?: string | null
  default?: boolean | null
}

/** A side limit of a specification row (POST /v1/accessories/specification/limit/side/table). */
export type SideLimit = {
  id: number
  number?: number | null
  minLength?: number | null
  maxLength?: number | null
  minCorner?: number | null
  maxCorner?: number | null
}
