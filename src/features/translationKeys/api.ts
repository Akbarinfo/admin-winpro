import { api } from '@/shared/api/client'
import type { SortDir } from '@/shared/api/table'
import { translationKeyApi, translationKeyKeys } from '@/shared/translations'
import type { ImportResult, TranslationPage } from './types'

// Query keys: the shared translationKeyKeys, as the translation-key fields elsewhere (profile
// systems) use — a key created there shows up here, and the other way round.
export { translationKeyKeys }

export type TranslationQuery = {
  /** 1-based, as this endpoint counts */
  page: number
  size: number
  sort: { column: string; dir: SortDir }
  search: string
}

const enc = encodeURIComponent

// Endpoints and bodies match the old panel (layout/translation, services/translationCrudService.js).
export const translationApi = {
  /** Not a DataTables table: { page, size, order, filter: { query } } (no filter without a search). */
  table: ({ page, size, sort, search }: TranslationQuery, signal?: AbortSignal) =>
    api
      .post<TranslationPage>(
        '/v1/translation/table',
        {
          page,
          size,
          order: [{ column: sort.column, dir: sort.dir.toUpperCase() }],
          filter: search ? { query: search } : {},
        },
        { signal },
      )
      .then((r) => r.data),

  byKey: translationKeyApi.byKey,

  /** A new key: POST /v1/translation { key, translations }; an existing one: PUT …/{key} { translations }. */
  save: (key: string, translations: { code: string; value: string }[], existing: boolean) =>
    existing
      ? api.put(`/v1/translation/${enc(key)}`, { translations })
      : translationKeyApi.create(key, translations),

  remove: (key: string) => api.delete(`/v1/translation/${enc(key)}`),

  importExcel: (file: File, onProgress: (percent: number) => void) => {
    const form = new FormData()
    form.append('file', file)
    return api
      .post<ImportResult>('/v1/translation/import-excel', form, {
        onUploadProgress: (e) => onProgress(Math.floor((e.loaded / (e.total || e.loaded)) * 100)),
      })
      .then((r) => r.data)
  },

  exportExcel: () =>
    api.get<Blob>('/v1/translation/export-excel', { responseType: 'blob' }).then((r) => r.data),
}
