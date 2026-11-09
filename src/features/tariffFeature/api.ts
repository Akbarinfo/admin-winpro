import { api } from '@/shared/api/client'
import type { TariffFeatureValues } from './schema'
import type { TariffFeature } from './types'

export const tariffFeatureKeys = { all: ['tariff-feature'] as const }

// Endpoints and bodies match the old panel (layout/tariffFeature, services/tariffFeatureService.js).
// There is no /table endpoint: the whole list comes at once.
export const tariffFeatureApi = {
  list: (signal?: AbortSignal) =>
    api.get<TariffFeature[]>('/v1/tariff-feature/list', { signal }).then((r) => r.data),

  get: (id: string, signal?: AbortSignal) =>
    api.get<TariffFeature>(`/v1/tariff-feature/${id}`, { signal }).then((r) => r.data),

  /** Tariff names a feature can belong to. */
  tariffs: (signal?: AbortSignal) =>
    api.get<string[]>('/v1/tariff-price/tariffs', { signal }).then((r) => r.data),

  /** POST without id; PUT with the id added at the end — both on /v1/tariff-feature. */
  save: (values: TariffFeatureValues, id?: string) => {
    const body = {
      tariff: values.tariff,
      featureKey: values.featureKey,
      featureLabel: values.featureLabel,
      value: values.value,
      featureType: values.featureType,
      unit: values.unit,
      sortOrder: Math.trunc(values.sortOrder ?? 0),
    }
    return id
      ? api.put('/v1/tariff-feature', { ...body, id })
      : api.post('/v1/tariff-feature', body)
  },

  remove: (id: number) => api.delete(`/v1/tariff-feature/${id}`),
}
