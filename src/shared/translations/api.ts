import { api } from '@/shared/api/client'
import type { Translation, TranslationDto } from './helpers'

const all = ['country-translation'] as const

export const translationKeys = {
  all,
  of: (entityType: string, entityId: number) => [...all, entityType, entityId] as const,
}

/** Excel import of translations and its example file (the product list uses them too). */
export const TRANSLATION_EXCEL = {
  upload: '/v1/product/translation/upload',
  template: '/v1/product/translation/excel/example',
}

// Endpoints match the old panel (services/translationService.js).
export const translationApi = {
  byEntity: (entityType: string, entityId: number, signal?: AbortSignal) =>
    api
      .get<Translation[]>(`/v1/country-translation/${entityType}/${entityId}`, { signal })
      .then((r) => r.data),

  saveBatch: (dtos: TranslationDto[]) => api.post('/v1/country-translation/batch', dtos),

  remove: (id: number) => api.delete(`/v1/country-translation/${id}`),

  /** Texts of one record from Excel: multipart «file», «entityType», «entityId» (the old TranslationTable). */
  importExcel: (
    entityType: string,
    entityId: number,
    file: File,
    onProgress: (percent: number) => void,
  ) => {
    const form = new FormData()
    form.append('file', file)
    form.append('entityType', entityType)
    form.append('entityId', String(entityId))
    return api.post(TRANSLATION_EXCEL.upload, form, {
      onUploadProgress: (e) => onProgress(Math.floor((e.loaded / (e.total || e.loaded)) * 100)),
    })
  },

  template: () =>
    api.get<Blob>(TRANSLATION_EXCEL.template, { responseType: 'blob' }).then((r) => r.data),
}
