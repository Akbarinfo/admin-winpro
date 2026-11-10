import { api } from '@/shared/api/client'
import type { Translation, TranslationDto } from './helpers'

const all = ['country-translation'] as const

export const translationKeys = {
  all,
  of: (entityType: string, entityId: number) => [...all, entityType, entityId] as const,
}

// Endpoints match the old panel (services/translationService.js).
export const translationApi = {
  byEntity: (entityType: string, entityId: number, signal?: AbortSignal) =>
    api
      .get<Translation[]>(`/v1/country-translation/${entityType}/${entityId}`, { signal })
      .then((r) => r.data),

  saveBatch: (dtos: TranslationDto[]) => api.post('/v1/country-translation/batch', dtos),

  remove: (id: number) => api.delete(`/v1/country-translation/${id}`),
}
