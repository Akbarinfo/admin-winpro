import { api } from '@/shared/api/client'
import { ApiError } from '@/shared/api/errors'
import { countryKeys } from '@/shared/lookups/countries'
import type { CountryValues, ProviderValues } from './schema'
import type { CountryProvider, CountryRecord } from './types'

// The same key as the phone-field lookup, so saving a country refreshes phone masks too.
export { countryKeys }
export const providerKeys = { of: (countryId: string) => ['country-provider', countryId] as const }

/** Backend bucket errors («bucket.not.found»…) shown under the bucket field. */
function bucketError(error: unknown): never {
  if (error instanceof ApiError) {
    const key = error.message.includes('bucket.not.found')
      ? 'countries.bucket_errors.not_found'
      : error.message.includes('bucket.invalid')
        ? 'countries.bucket_errors.invalid'
        : null
    if (key) throw new ApiError(error.status, error.message, { storageBucket: key })
  }
  throw error
}

// Endpoints and bodies match the old panel (layout/country, services/countryProviderService.js).
export const countryApi = {
  list: (signal?: AbortSignal) =>
    api.get<CountryRecord[]>('/v1/country/list', { signal }).then((r) => r.data),

  get: (id: string, signal?: AbortSignal) =>
    api.get<CountryRecord>(`/v1/country/${id}`, { signal }).then((r) => r.data),

  /**
   * multipart: «country» — the record as JSON, «file» — the flag, only when a new one is chosen.
   * POST and PUT both on /v1/country; the id is added only when editing.
   * The bucket is always sent (null for the shared one) — otherwise the backend clears it.
   */
  save: ({ file, ...values }: CountryValues, id?: string) => {
    const data = {
      name: values.name,
      code: values.code,
      isActive: values.isActive,
      length: values.length,
      isDefault: values.isDefault,
      phoneCode: values.phoneCode,
      codeSlice: values.codeSlice,
      phoneFormat: values.phoneFormat,
      digitsLength: values.digitsLength,
      currencyId: values.currencyId,
      storageBucket: values.storageBucket || null,
      ...(id && { id: Number(id) }),
    }
    const body = new FormData()
    body.append('country', new Blob([JSON.stringify(data)], { type: 'application/json' }))
    if (file) body.append('file', file)
    return (id ? api.put('/v1/country', body) : api.post('/v1/country', body)).catch(bucketError)
  },

  remove: (id: number) => api.delete(`/v1/country/${id}`),
}

export const providerApi = {
  list: (countryId: string, signal?: AbortSignal) =>
    api
      .get<CountryProvider[]>(`/v1/country-provider/${countryId}`, { signal })
      .then((r) => (Array.isArray(r.data) ? r.data : [])),

  /** POST without an id, PUT with it — both on /v1/country-provider. */
  save: (countryId: string, values: ProviderValues, id?: number): Promise<unknown> => {
    const body = { ...values, countryId: Number(countryId) }
    return id
      ? api.put('/v1/country-provider', { id, ...body })
      : api.post('/v1/country-provider', body)
  },

  remove: (id: number) => api.delete(`/v1/country-provider/${id}`),
}
