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
