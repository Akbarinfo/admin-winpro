import { api } from '@/shared/api/client'
import type { TableBody, TablePage } from '@/shared/api/table'
import type { ExchangeValues } from './schema'
import type { Exchange } from './types'

export const exchangeKeys = { all: ['exchange'] as const }

// Endpoints and bodies match the old panel (layout/exchange, services/exchangeService.js).
export const exchangeApi = {
  table: (body: TableBody, signal?: AbortSignal) =>
    api.post<TablePage<Exchange>>('/v1/exchange/table', body, { signal }).then((r) => r.data),

  get: (id: string, signal?: AbortSignal) =>
    api.get<Exchange>(`/v1/exchange/${id}`, { signal }).then((r) => r.data),

  /** Create without id (POST), update with id (PUT) — both on /v1/exchange. */
  save: (values: ExchangeValues, id?: string) => {
    const body = { id: id ?? null, ...values }
    return id ? api.put('/v1/exchange', body) : api.post('/v1/exchange', body)
  },

  remove: (id: number) => api.delete(`/v1/exchange/${id}`),
}
