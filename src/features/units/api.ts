import { api } from '@/shared/api/client'
import type { TableBody, TablePage } from '@/shared/api/table'
import type { UnitValues } from './schema'
import type { Unit } from './types'

export const unitKeys = { all: ['unit'] as const }

// Endpoints and bodies match the old panel (layout/unit, services/unitService.js).
export const unitApi = {
  table: (body: TableBody, signal?: AbortSignal) =>
    api.post<TablePage<Unit>>('/v1/unit/table', body, { signal }).then((r) => r.data),

  get: (id: string, signal?: AbortSignal) =>
    api.get<Unit>(`/v1/unit/${id}`, { signal }).then((r) => r.data),

  /** Create without id (POST), update with id (PUT) — both on /v1/unit. */
  save: (values: UnitValues, id?: string) => {
    const body = { id: id ?? null, ...values }
    return id ? api.put('/v1/unit', body) : api.post('/v1/unit', body)
  },

  remove: (id: number) => api.delete(`/v1/unit/${id}`),
}
