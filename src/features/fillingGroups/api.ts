import { api } from '@/shared/api/client'
import type { TableBody, TablePage } from '@/shared/api/table'
import { fillingGroupKeys } from '@/shared/lookups/fillings'
import type { ParameterEndpoint } from '@/shared/parameters'
import type { FillingGroupValues, FillingSpecValues } from './schema'
import type { FillingGroup, FillingSpecification } from './types'

// Under the shared key: saving a group refreshes the group pickers of other sections too.
const all = fillingGroupKeys.all
export const fillingKeys = {
  all,
  detail: (id: string) => [...all, 'detail', id] as const,
  specs: [...all, 'specs'] as const,
}

const G = '/v1/filling/group'
const S = '/v1/filling/specification/group'

// Endpoints and bodies match the old panel (layout/filling, components/filling). One difference:
// clearance and thickness go as numbers — the old uncontrolled inputs sent their text.
export const fillingApi = {
  table: (body: TableBody, signal?: AbortSignal) =>
    api.post<TablePage<FillingGroup>>(`${G}/table`, body, { signal }).then((r) => r.data),

  get: (id: string, signal?: AbortSignal) =>
    api.get<FillingGroup>(`${G}/${id}`, { signal }).then((r) => r.data),

  /** Always POST, an edit too (with the URL's id in the body), as the old page did. */
  save: (values: FillingGroupValues, id?: string) => api.post(G, { id: id ?? null, ...values }),

  remove: (id: number) => api.delete(`${G}/${id}`),

  copy: (id: number) => api.post(`${G}/copy/${id}`),

  specs: (body: TableBody, signal?: AbortSignal) =>
    api.post<TablePage<FillingSpecification>>(`${S}/table`, body, { signal }).then((r) => r.data),

  spec: (id: string, signal?: AbortSignal) =>
    api.get<FillingSpecification>(`${S}/${id}`, { signal }).then((r) => r.data),

  /** Always POST, an edit too (with its id in the body), as the old modal did. */
  saveSpec: (fillingGroupId: string, values: FillingSpecValues, id?: string) =>
    api.post(S, { id: id === undefined ? null : Number(id), ...values, fillingGroupId }),

  removeSpec: (id: number) => api.delete(`${S}/${id}`),
}

/** A specification row's parameters (their values were shown translated). */
export const SPEC_PARAMETERS: ParameterEndpoint = {
  base: '/v1/filling/parameter',
  enumUrl: '/v1/filling/parameter/enum/type',
  kindField: 'fillingParameterType',
  parentField: 'fillingSpecificationId',
  filterField: 'fillingSpecificationId',
  translateValue: true,
}
