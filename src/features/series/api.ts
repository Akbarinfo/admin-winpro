import { api } from '@/shared/api/client'
import type { TableBody, TablePage } from '@/shared/api/table'
import { seriesKeys } from '@/shared/lookups/series'
import type { SeriesValues } from './schema'
import type { Series } from './types'

// Same key as the shared series lookup: saving or deleting here also refreshes
// the series lists used by other sections (e.g. product filters).
export { seriesKeys }

// Endpoints and bodies match the old panel (layout/series, services/seriesService.js).
export const seriesApi = {
  table: (body: TableBody, signal?: AbortSignal) =>
    api.post<TablePage<Series>>('/v1/product/series/table', body, { signal }).then((r) => r.data),

  get: (id: string, signal?: AbortSignal) =>
    api.get<Series>(`/v1/product/series/${id}`, { signal }).then((r) => r.data),

  /** Create without id (POST), update with id (PUT) — both on /v1/product/series. */
  save: (values: SeriesValues, id?: string) => {
    const body = { id: id ?? null, ...values }
    return id ? api.put('/v1/product/series', body) : api.post('/v1/product/series', body)
  },

  remove: (id: number) => api.delete(`/v1/product/series/${id}`),
}
