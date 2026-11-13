import { api } from '@/shared/api/client'
import type {
  AkfaPosition,
  AkfaProduct,
  AkfaSummary,
  HubPage,
  IgnoreResult,
  ProductDraft,
  SavedMapping,
} from './types'

export const akfaKeys = {
  all: ['akfa'] as const,
  /** The summary and the counts beside it: refreshed after any change. */
  summary: ['akfa', 'summary'] as const,
  /** Product lists of the tabs. */
  products: ['akfa', 'products'] as const,
}

/** The old tabs' page size. */
export const AKFA_PAGE_SIZE = 20

/** WinPro product groups, as the old picker listed them (their names are legacy i18n keys). */
export const ARTICLE_GROUP_TYPES = ['PROFILES', 'ACCESSORIES', 'SEAL', 'FILLINGS']

/** Empty values are left out of the query, as the old buildQuery did. */
const query = (params: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  )

/** The file name from Content-Disposition (filename*=UTF-8''… or filename="…"). */
export function fileNameOf(disposition: string | undefined, fallback: string) {
  const match = (disposition ?? '').match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i)
  return match ? decodeURIComponent(match[1]) : fallback
}

export type AkfaProductQuery = {
  search?: string
  externalStatus?: string
  hasRate?: boolean
  mappingStatus?: string
  priceStatus?: string
  isNew?: boolean
  source?: string
  group?: string
  /** 1-based */
  page?: number
  size?: number
}

const A = '/v1/akfa'

// Endpoints and bodies match the old panel (services/akfa/akfaService.js).
export const akfaApi = {
  summary: (signal?: AbortSignal) =>
    api.get<AkfaSummary>(`${A}/summary`, { signal }).then((r) => r.data),

  products: (params: AkfaProductQuery, signal?: AbortSignal) =>
    api
      .get<HubPage<AkfaProduct>>(`${A}/products`, { params: query(params), signal })
      .then((r) => r.data),

  markSeen: (id: number) => api.post(`${A}/products/${id}/mark-seen`),

  ignore: (ids: number[], reason: string) =>
    api.post<IgnoreResult>(`${A}/products/ignore`, { ids, reason }).then((r) => r.data),

  /** The products not mapped yet, as Excel. */
  exportUnmapped: () =>
    api.get<Blob>(`${A}/products/export`, { responseType: 'blob' }).then((r) => ({
      blob: r.data,
      fileName: fileNameOf(
        r.headers?.['content-disposition'] as string | undefined,
        'akfa-unmapped-products.xlsx',
      ),
    })),

  /** WinPro positions with a price: by name/article, group type, series. */
  positions: (
    params: { q?: string; articleGroupType?: string; productSeriesId?: number | null },
    signal?: AbortSignal,
  ) =>
    api
      .get<AkfaPosition[]>(`${A}/positions/search`, { params: query(params), signal })
      .then((r) => r.data ?? []),

  /** Every texture of a product, for the positions without a price. */
  productTextures: (productId: number, signal?: AbortSignal) =>
    api
      .get<{ id: number; name: string }[]>(`/v1/texture/list/by/productId/${productId}`, {
        signal,
      })
      .then((r) => r.data ?? []),

  map: (id: number, targets: { productId: number; textureId: number }[]) =>
    api.post<SavedMapping[]>(`${A}/products/${id}/map`, { targets }).then((r) => r.data ?? []),

  draft: (id: number, signal?: AbortSignal) =>
    api.get<ProductDraft>(`${A}/products/${id}/product-draft`, { signal }).then((r) => r.data),

  /** A new WinPro product made from the Akfa one, linked to it at once. */
  createProduct: (id: number, body: { product: object; textureIds: number[] }) =>
    api
      .post<{ productId?: number; id?: number; name?: string; productName?: string }>(
        `${A}/products/${id}/create-product`,
        body,
      )
      .then((r) => r.data),
}
