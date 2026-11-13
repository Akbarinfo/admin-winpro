import { api } from '@/shared/api/client'

/** A product as the search returns it. */
export type ProductOption = { id: number; name: string }

/** Products are searched on the backend, 200 at a time (the old ProductSearchCombobox's size). */
export const PRODUCT_SEARCH_SIZE = 200

export const productSearchKeys = { all: ['product-search'] as const }

export const productSearchApi = {
  /** GET /v1/product/article/product?page=0&size=200[&search][&profileType] */
  search: (search: string, profileType: string | undefined, signal?: AbortSignal) => {
    const params = new URLSearchParams({ page: '0', size: String(PRODUCT_SEARCH_SIZE) })
    if (search.trim()) params.set('search', search.trim())
    if (profileType) params.set('profileType', profileType)
    return api
      .get<ProductOption[]>(`/v1/product/article/product?${params}`, { signal })
      .then((r) => r.data)
  },

  /** The chosen product, so the field shows it on edit even if it isn't in the first 200. */
  get: (id: number, signal?: AbortSignal) =>
    api.get<ProductOption>(`/v1/product/article/product/${id}`, { signal }).then((r) => r.data),
}
