import { api } from '@/shared/api/client'
import type { UnitMappingValues } from './schema'
import type {
  AkfaMapping,
  MappingAkfaProduct,
  MappingChange,
  MappingConflict,
  MappingImportResult,
  TextureOption,
  WinproProduct,
  AkfaMessage,
  AkfaPosition,
  AkfaProduct,
  AkfaSummary,
  AkfaUnitMapping,
  BulkResult,
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
  /** Links of WinPro positions to Akfa products (price changes, mapping). */
  mappings: ['akfa', 'mappings'] as const,
  /** The inbound message log. */
  messages: ['akfa', 'messages'] as const,
  /** Akfa units ↔ WinPro units (/integrations/unit). */
  units: ['akfa', 'units'] as const,
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

  mappings: (
    params: {
      status?: string
      priceStatus?: string
      search?: string
      minDelta?: number | null
      page?: number
      size?: number
    },
    signal?: AbortSignal,
  ) =>
    api
      .get<HubPage<AkfaMapping>>(`${A}/mappings`, { params: query(params), signal })
      .then((r) => r.data),

  /** A stale price (changed some other way) answers 409 unless `force`. */
  approvePrice: (id: number, force = false) =>
    api.put(`${A}/mappings/${id}/approve-price?force=${force}`),

  rejectPrice: (id: number) => api.put(`${A}/mappings/${id}/reject-price`),

  bulkApprovePrice: (ids: number[], force = false) =>
    api.put<BulkResult>(`${A}/mappings/bulk-approve-price`, { ids, force }).then((r) => r.data),

  bulkRejectPrice: (ids: number[]) =>
    api.put<BulkResult>(`${A}/mappings/bulk-reject-price`, { ids }).then((r) => r.data),

  messages: (
    params: { status?: string | null; type?: string | null; page?: number; size?: number },
    signal?: AbortSignal,
  ) =>
    api
      .get<HubPage<AkfaMessage>>(`${A}/messages`, { params: query(params), signal })
      .then((r) => r.data),

  message: (id: number, signal?: AbortSignal) =>
    api.get<AkfaMessage>(`${A}/messages/${id}`, { signal }).then((r) => r.data),

  /** Processes a failed or partial message again. */
  retryMessage: (id: number) => api.post(`${A}/messages/${id}/retry`),

  /** Recalculates every WinPro price from the Akfa rates (runs on the server). */
  recalculateRates: () => api.post(`${A}/rates/recalculate`),

  /** WinPro products with their link state; linkStatus: all | mapped | unmapped. */
  winproProducts: (
    params: { search?: string; linkStatus?: string; page?: number; size?: number },
    signal?: AbortSignal,
  ) =>
    api
      .get<HubPage<WinproProduct>>(`${A}/winpro-products`, { params: query(params), signal })
      .then((r) => r.data),

  textureOptions: (productId: number, signal?: AbortSignal) =>
    api
      .get<TextureOption[] | { data: TextureOption[] }>(
        `${A}/winpro-products/${productId}/texture-options`,
        { signal },
      )
      .then((r) => (Array.isArray(r.data) ? r.data : (r.data?.data ?? []))),

  /** Akfa products with the textures linked to them; linkStatus: all | unmapped. */
  mappingAkfaProducts: (
    params: { search?: string; linkStatus?: string; page?: number; size?: number },
    signal?: AbortSignal,
  ) =>
    api
      .get<HubPage<MappingAkfaProduct>>(`${A}/mappings/akfa-products`, {
        params: query(params),
        signal,
      })
      .then((r) => r.data),

  /**
   * Only the changed links. 409 — another admin changed some meanwhile: its body (the conflicts)
   * is needed, so it isn't turned into an error here.
   */
  saveMappings: (changes: MappingChange[]) =>
    api
      .put<{ conflicts?: MappingConflict[] | null; message?: string | null }>(
        `${A}/mappings/batch`,
        { changes },
        { validateStatus: (s) => (s >= 200 && s < 300) || s === 409 },
      )
      .then((r) => ({ conflict: r.status === 409, body: r.data })),

  /** The current links as Excel, to fill in «Akfa External ID». */
  mappingTemplate: () =>
    api.get<Blob>(`${A}/mappings/export-template`, { responseType: 'blob' }).then((r) => ({
      blob: r.data,
      fileName: fileNameOf(
        r.headers?.['content-disposition'] as string | undefined,
        'akfa-mapping-template.xlsx',
      ),
    })),

  /** 409 comes with the conflicts (nothing saved): read like a result. */
  importMappings: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api
      .post<MappingImportResult>(`${A}/mappings/import/excel`, form, {
        validateStatus: (s) => (s >= 200 && s < 300) || s === 409,
      })
      .then((r) => ({ conflict: r.status === 409, result: r.data ?? {} }))
  },

  unitMappings: (signal?: AbortSignal) =>
    api.get<AkfaUnitMapping[]>(`${A}/unit-mappings`, { signal }).then((r) => r.data ?? []),

  /** POST without id, PUT with it (its body carries the id too, as the old panel's did). */
  saveUnitMapping: (values: UnitMappingValues, id?: string) =>
    id === undefined
      ? api.post(`${A}/unit-mappings`, values)
      : api.put(`${A}/unit-mappings/${id}`, { id: Number(id), ...values }),

  removeUnitMapping: (id: number) => api.delete(`${A}/unit-mappings/${id}`),
}
