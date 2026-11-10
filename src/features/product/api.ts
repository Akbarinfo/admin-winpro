import { api } from '@/shared/api/client'
import type { TableBody, TablePage } from '@/shared/api/table'
import type { ArticleType, GroupType, ProductRow } from './types'

export const productKeys = {
  all: ['product'] as const,
  articleTypes: (groupType: GroupType) => ['product', 'article-types', groupType] as const,
}

// Endpoints and bodies match the old panel (layout/product/<group>/*.js).
// The group goes in the table filter as `groupType`.
export const productApi = {
  table: (body: TableBody, signal?: AbortSignal) =>
    api.post<TablePage<ProductRow>>('/v1/product/table', body, { signal }).then((r) => r.data),

  /** Types of articles in a group: FRAME, SASH… for profiles. */
  articleTypes: (groupType: GroupType, signal?: AbortSignal) =>
    api
      .get<ArticleType[]>(`/v1/product/enum/article/type/${groupType}`, { signal })
      .then((r) => r.data),

  /** Makes a copy of the product and returns it — the old panel opened the copy's form next. */
  copy: (id: number) => api.post<{ id: number }>(`/v1/product/copy/${id}`).then((r) => r.data),

  remove: (id: number) => api.delete(`/v1/product/${id}`),
}
