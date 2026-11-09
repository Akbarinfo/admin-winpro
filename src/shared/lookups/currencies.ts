import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api/client'

export type Currency = {
  id: number
  name: string
  symbol: string
  /** The country's base currency (сум for UZ). */
  isMain?: boolean
}

export const currencyKeys = { all: ['currency'] as const }

// Reference lists change rarely: load once, keep for 10 minutes, share across pages.
export function useCurrencies() {
  return useQuery({
    queryKey: [...currencyKeys.all, 'list'],
    queryFn: ({ signal }) =>
      api.get<Currency[]>('/v1/currency/list', { signal }).then((r) => r.data),
    staleTime: 10 * 60_000,
  })
}

export const currencyLabel = (c: Currency) => (c.symbol ? `${c.name} (${c.symbol})` : c.name)

/** Minimum digits after the comma for amounts in this currency: dollars show cents («1,50»). */
export const currencyDecimals = (c: Currency | null | undefined) =>
  c && (c.symbol === '$' || /доллар|dollar|\busd\b/i.test(c.name)) ? 2 : 0
