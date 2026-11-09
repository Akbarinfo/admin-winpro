import { api } from '@/shared/api/client'
import type { TableBody, TablePage } from '@/shared/api/table'
import { currencyKeys, type Currency } from '@/shared/lookups/currencies'
import type { CurrencyValues } from './schema'

// Same key as the shared currency lookup: saving or deleting here also refreshes
// the currency lists used by other sections (e.g. the exchange-rate form).
export { currencyKeys }

// Endpoints and bodies match the old panel (layout/curency, services/currecyService.js).
export const currencyApi = {
  table: (body: TableBody, signal?: AbortSignal) =>
    api.post<TablePage<Currency>>('/v1/currency/table', body, { signal }).then((r) => r.data),

  get: (id: string, signal?: AbortSignal) =>
    api.get<Currency>(`/v1/currency/${id}`, { signal }).then((r) => r.data),

  /** Create without id (POST), update with id (PUT) — both on /v1/currency. */
  save: (values: CurrencyValues, id?: string) => {
    const body = { id: id ?? null, ...values }
    return id ? api.put('/v1/currency', body) : api.post('/v1/currency', body)
  },

  remove: (id: number) => api.delete(`/v1/currency/${id}`),
}
