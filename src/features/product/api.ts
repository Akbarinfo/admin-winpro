import { api } from '@/shared/api/client'
import { multipartBody } from '@/shared/api/files'
import type { TableBody, TablePage } from '@/shared/api/table'
import type { PriceValues } from './priceSchema'
import type {
  ArticleType,
  GroupType,
  PriceDetail,
  ProductDetail,
  ProductPrice,
  ProductRow,
} from './types'

/** The saved product, or { error } with status 206. */
type SaveResponse = { id?: number; error?: string }

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

  get: (id: string, signal?: AbortSignal) =>
    api.get<ProductDetail>(`/v1/product/${id}`, { signal }).then((r) => r.data),

  /**
   * multipart: «data» — the product as JSON (built by the group's form, forms/<group>.tsx),
   * «image» — a new drawing ("null" without one). POST and PUT both on the group's URL
   * (/v1/product/profile, /v1/product/seal…). A 206 answer is a warning: the product wasn't saved.
   */
  saveProduct: (url: string, data: object, drawing: File | null, id?: string) => {
    const body = multipartBody(data, drawing)
    const request = id ? api.put<SaveResponse>(url, body) : api.post<SaveResponse>(url, body)
    return request.then((r) => ({ status: r.status, data: r.data }))
  },

  remove: (id: number) => api.delete(`/v1/product/${id}`),

  /** Excel of the filtered list: products («information») or their prices. */
  exportExcel: (kind: 'information' | 'price', filter: object) =>
    api
      .post<Blob>(`/v1/product/excel/${kind}`, { filter }, { responseType: 'blob' })
      .then((r) => r.data),

  /** An example file to fill in for an import. */
  template: (url: string) => api.get<Blob>(url, { responseType: 'blob' }).then((r) => r.data),

  /**
   * Import: multipart «file». The answer says whether every row went in; if not,
   * `base64` is an Excel of the rows that didn't (the old panel saved it as failed-product.xlsx).
   */
  importExcel: (url: string, file: File, onProgress: (percent: number) => void) => {
    const form = new FormData()
    form.append('file', file)
    return api
      .post<ImportResult>(url, form, {
        onUploadProgress: (e) => onProgress(Math.floor((e.loaded / (e.total || e.loaded)) * 100)),
      })
      .then((r) => r.data)
  },
}

export type ImportResult = { isEmpty: boolean; base64?: string | null }

/** Prices have their own key: the product's detail and price detail ids would clash under one. */
export const priceKeys = { all: ['product-price'] as const }

// Endpoints and bodies match the old panel (layout/product/NewPriceLayoutV2.jsx, components/product/ModalPrice.js).
export const priceApi = {
  /** Prices of one product, optionally of one country. The old panel sent an empty `order`. */
  table: (body: TableBody, signal?: AbortSignal) =>
    api
      .post<TablePage<ProductPrice>>('/v1/product/price/table', body, { signal })
      .then((r) => r.data),

  get: (id: string, signal?: AbortSignal) =>
    api.get<PriceDetail>(`/v1/product/price/${id}`, { signal }).then((r) => r.data),

  /** POST without id, PUT with it — both on /v1/product/price. */
  save: (values: PriceValues, productId: number, id?: string) => {
    const body = { id: id ? Number(id) : null, productId, ...values }
    return id ? api.put('/v1/product/price', body) : api.post('/v1/product/price', body)
  },

  copy: (id: number) => api.post(`/v1/product/price/copy/${id}`),

  remove: (id: number) => api.delete(`/v1/product/price/${id}`),
}
