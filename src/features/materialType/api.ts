import { api } from '@/shared/api/client'
import type { TableBody, TablePage } from '@/shared/api/table'
import { materialTypeKeys } from '@/shared/lookups/materialTypes'
import type { MaterialTypeValues } from './schema'
import type { MaterialType } from './types'

// Same key as the shared material-types lookup: saving here refreshes the lists elsewhere too.
export { materialTypeKeys }

// Endpoints and bodies match the old panel (layout/materialType).
export const materialTypeApi = {
  table: (body: TableBody, signal?: AbortSignal) =>
    api
      .post<TablePage<MaterialType>>('/v1/material-type/table', body, { signal })
      .then((r) => r.data),

  get: (id: string, signal?: AbortSignal) =>
    api.get<MaterialType>(`/v1/material-type/${id}`, { signal }).then((r) => r.data),

  /** Create without id (POST), update with id (PUT) — both on /v1/material-type. */
  save: (values: MaterialTypeValues, id?: string) => {
    const body = { id: id ?? null, ...values }
    return id ? api.put('/v1/material-type', body) : api.post('/v1/material-type', body)
  },

  remove: (id: number) => api.delete(`/v1/material-type/${id}`),
}
