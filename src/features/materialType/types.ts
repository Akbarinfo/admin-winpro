/** As returned by /v1/material-type. */
export type MaterialType = {
  id: number
  name: string
  description?: string | null
  isDefault?: boolean
  isTesting?: boolean
}
