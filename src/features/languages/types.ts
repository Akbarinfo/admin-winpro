/** An interface language as returned by /v1/language. The code (ru, uz, en…) is its id. */
export type Language = {
  code: string
  name: string
  default: boolean
  active: boolean
}
