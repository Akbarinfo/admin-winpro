import { api } from '@/shared/api/client'
import { multipartBody } from '@/shared/api/files'
import type { TableBody, TablePage } from '@/shared/api/table'
import type { PriceValues } from './priceSchema'
import type { ProfileValues } from './schema'
import type {
  ArticleType,
  ChosenNames,
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
   * multipart: «data» — the profile as JSON, «image» — a new drawing ("null" without one).
   * POST and PUT both on /v1/product/profile; the id is the URL string, as in the old form.
   * Empty numbers go as null — the old form sent "" (Jackson reads both as null).
   * A 206 answer is a warning from the backend: the profile wasn't saved.
   */
  saveProfile: ({ drawing, ...v }: ProfileValues, names: ChosenNames, id?: string) => {
    const data = {
      id: id ?? null,
      name: v.name,
      nameInCatalog: v.nameInCatalog,
      article: v.article,
      length: v.length,
      width: v.width,
      thickness: v.thickness,
      sizeB: v.sizeB,
      sizeF: v.sizeF,
      sizeN: v.sizeN,
      comeIn: v.comeIn,
      articleSpecificWeight: v.articleSpecificWeight,
      momentJx: v.momentJx,
      momentJy: v.momentJy,
      sectionArea: v.sectionArea,
      drawingId: v.drawingId,
      productSeriesId: v.productSeriesId,
      productSeriesName: names.productSeriesName,
      unitId: v.unitId,
      unitName: names.unitName,
      supplierId: v.supplierId,
      supplierName: names.supplierName,
      profileType: v.profileType ?? '',
      wastePercent: v.wastePercent,
      usefulPiece: v.usefulPiece,
      isArcProfile: v.isArcProfile,
      isReinforced: v.isReinforced,
      needCuttingOptimization: v.needCuttingOptimization,
      trackCount: v.trackCount,
      sashClearance: v.sashClearance,
    }
    const body = multipartBody(data, drawing)
    const request = id
      ? api.put<SaveResponse>('/v1/product/profile', body)
      : api.post<SaveResponse>('/v1/product/profile', body)
    return request.then((r) => ({ status: r.status, data: r.data }))
  },

  remove: (id: number) => api.delete(`/v1/product/${id}`),
}

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
