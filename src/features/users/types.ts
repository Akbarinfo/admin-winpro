/** A row of /v1/user/table and GET /v1/user/:id. */
export type User = {
  id: number
  fullName?: string | null
  /** Login — an email */
  username?: string | null
  phone?: string | null
  role?: string | null
  imageId?: number | null
  supplierId?: number | null
}

/** From /v1/user/enum/role/type. */
export type UserRole = { name: string }

/** Roles that belong to a supplier's staff: the user is tied to one supplier. */
export const SUPPLIER_ROLES = ['SUPPLIER_OWNER', 'SUPPLIER_MANAGER']
