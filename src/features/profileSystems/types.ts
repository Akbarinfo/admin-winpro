/** A characteristic: two translation keys (what and its value), shown in the apps. */
export type Characteristic = { key: string; value: string }

/** GET /v1/profile/system/{id}. */
export type ProfileSystem = {
  id: number
  name: string
  parentId?: number | null
  defaultGlassId?: number | null
  defaultPanelId?: number | null
  fillingGroupId?: number | null
  materialTypeId?: number | null
  supplierId?: number | null
  isVisible?: boolean | null
  isDefault?: boolean | null
  isTesting?: boolean | null
  visibility?: string | null
  slidingType?: string | null
  clientScope?: string | null
  sashClearance?: number | null
  maxTrackCount?: number | null
  imageId?: number | null
  /** Its characteristics, saved separately (/v1/profile-system-full-info) */
  profileSystemFullInfo?: { id?: number | null; characteristics?: Characteristic[] | null } | null
}

/** An item of the enum lists (/enum/sliding/type, /enum/client/scope). */
export type EnumItem = { id?: number; name: string }

/** A row of POST /v1/profile/system/specification/table. Enum values are legacy i18n keys. */
export type SpecificationRow = {
  id: number
  priority?: number | null
  article?: string | null
  name?: string | null
  applicationType?: string | null
  sideType?: string | null
}

/** GET /v1/profile/system/specification/{id}. */
export type Specification = {
  id: number
  priority?: number | null
  productId?: number | null
  supplierId?: number | null
  applicationType?: string | null
  sideType?: string | null
}

/** A row of POST /v1/profile/system/accessories/table. */
export type SystemAccessoryRow = {
  id: number
  accessoryName?: string | null
  openingType?: string | null
  handleType?: string | null
}

/** GET /v1/profile/system/accessories/{id}. */
export type SystemAccessory = {
  id: number
  accessoryId?: number | null
  openingType?: string | null
  handleType?: string | null
  productId?: number | null
  supplierId?: number | null
}

/** A product found by /v1/product/article/product, or an accessory of /v1/accessories/list. */
export type NamedOption = { id: number; name: string }
