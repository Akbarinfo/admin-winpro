import { api } from '@/shared/api/client'
import type { TableBody, TablePage } from '@/shared/api/table'
import type { SalesCategoryValues } from './schema'
import type { SalesCategory, SalesCategoryRow } from './types'

export const salesCategoryKeys = { all: ['sale-categories'] as const }

// Endpoints and bodies match the old panel (layout/salesCategory).
export const salesCategoryApi = {
  table: (body: TableBody, signal?: AbortSignal) =>
    api
      .post<TablePage<SalesCategoryRow>>('/v1/sale-categories/table', body, { signal })
      .then((r) => r.data),

  get: (id: string, signal?: AbortSignal) =>
    api.get<SalesCategory>(`/v1/sale-categories/${id}`, { signal }).then((r) => r.data),

  /** Tariff names for «free for tariffs». */
  tariffs: (signal?: AbortSignal) =>
    api.get<string[]>('/v1/sale-categories/tariff/list', { signal }).then((r) => r.data),

  /** POST without an id, PUT with it — both on /v1/sale-categories. */
  save: (values: SalesCategoryValues, id?: string) => {
    const body = {
      name: values.name,
      description: values.description,
      price: values.price,
      currencyId: values.currencyId,
      freeForTariffs: values.freeForTariffs,
      profileSystemIds: values.profileSystemIds,
    }
    return id
      ? api.put('/v1/sale-categories', { id: Number(id), ...body })
      : api.post('/v1/sale-categories', body)
  },

  remove: (id: number) => api.delete(`/v1/sale-categories/${id}`),
}
