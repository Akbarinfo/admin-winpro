/** An exchange rate as returned by /v1/exchange. */
export type Exchange = {
  id: number
  fromCurrencyId: number
  toCurrencyId: number
  fromName: string
  toName: string
  /** «YYYY-MM-DD» or an ISO timestamp */
  date: string
  rate: number
}
