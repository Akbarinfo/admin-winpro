/** A row of /v2/mobile-user/table. */
export type MobileUser = {
  id: number
  createdDate?: string | null
  fullName?: string | null
  username?: string | null
  phone?: string | null
  role?: string | null
  /** Checked by an admin */
  isChecked?: boolean | null
  workshopId?: number | null
}
