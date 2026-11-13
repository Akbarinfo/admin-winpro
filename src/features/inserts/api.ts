import { api } from '@/shared/api/client'
import type { TableBody, TablePage } from '@/shared/api/table'
import type { ParameterEndpoint } from '@/shared/parameters'
import type { AdditionalSpecValues, AdditionalValues, ConsistValues } from './schema'
import type { Additional, AdditionalSpecification, Consist } from './types'

const all = ['inserts'] as const
export const insertKeys = {
  all,
  /** The key useEntityForm loads a record under (the page title reads it too). */
  detail: (id: string) => [...all, 'detail', id] as const,
  additional: [...all, 'additional'] as const,
  specs: [...all, 'specs'] as const,
}

// Endpoints and bodies match the old panel (layout/inserts, components/inserts).
export const insertApi = {
  table: (body: TableBody, signal?: AbortSignal) =>
    api.post<TablePage<Consist>>('/v1/consist/table', body, { signal }).then((r) => r.data),

  get: (id: string, signal?: AbortSignal) =>
    api.get<Consist>(`/v1/consist/${id}`, { signal }).then((r) => r.data),

  /** New: POST {productId, productName}. Edit: PUT the whole loaded record with the new product. */
  create: (values: ConsistValues) => api.post('/v1/consist', values),
  update: (record: Consist, values: ConsistValues) =>
    api.put('/v1/consist', { ...record, ...values }),

  remove: (id: number) => api.delete(`/v1/consist/${id}`),

  copy: (id: number) => api.post(`/v1/consist/copy/${id}`),

  additional: (body: TableBody, signal?: AbortSignal) =>
    api.post<TablePage<Additional>>('/v1/additional/table', body, { signal }).then((r) => r.data),

  getAdditional: (id: string, signal?: AbortSignal) =>
    api.get<Additional>(`/v1/additional/${id}`, { signal }).then((r) => r.data),

  /** POST without id, PUT with it — both on /v1/additional. */
  saveAdditional: (consistId: string, values: AdditionalValues, id?: string) => {
    const body = { id: id === undefined ? null : Number(id), ...values, consistId }
    return id === undefined ? api.post('/v1/additional', body) : api.put('/v1/additional', body)
  },

  removeAdditional: (id: number) => api.delete(`/v1/additional/${id}`),

  copyAdditional: (id: number) => api.post(`/v1/additional/copy/${id}`),

  /** The insert copied into another product's inserts. */
  copyToProduct: (additionalId: number, productId: number) =>
    api.post('/v1/additional/copy/to-product', { additionalId, productId }),

  specs: (body: TableBody, signal?: AbortSignal) =>
    api
      .post<TablePage<AdditionalSpecification>>('/v1/additional/specification/table', body, {
        signal,
      })
      .then((r) => r.data),

  spec: (id: string, signal?: AbortSignal) =>
    api
      .get<AdditionalSpecification>(`/v1/additional/specification/${id}`, { signal })
      .then((r) => r.data),

  /** POST without id, PUT with it — both on /v1/additional/specification. */
  saveSpec: (additionalId: number, values: AdditionalSpecValues, id?: string) => {
    const body = { id: id === undefined ? null : Number(id), ...values, additionalId }
    return id === undefined
      ? api.post('/v1/additional/specification', body)
      : api.put('/v1/additional/specification', body)
  },

  removeSpec: (id: number) => api.delete(`/v1/additional/specification/${id}`),

  copySpec: (id: number) => api.post(`/v1/additional/specification/copy/${id}`),
}

/** An insert's parameters (their values were shown translated). */
export const ADDITIONAL_PARAMETERS: ParameterEndpoint = {
  base: '/v1/additional/parameter',
  enumUrl: '/v1/additional/parameter/enum/type',
  kindField: 'additionalParameterType',
  parentField: 'additionalId',
  filterField: 'additionalId',
  translateValue: true,
}

/** A specification row's parameters. */
export const SPEC_PARAMETERS: ParameterEndpoint = {
  base: '/v1/additional/specification/parameter',
  enumUrl: '/v1/additional/specification/parameter/enum/type',
  kindField: 'additionalSpecificationType',
  parentField: 'specificationId',
  filterField: 'specificationId',
}
