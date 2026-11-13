import { api } from '@/shared/api/client'
import type { TableBody, TablePage } from '@/shared/api/table'

/** A parameter kind from the enum endpoint: TEXT takes a typed value, SELECT one from `url`. */
export type ParameterKind = {
  id: number
  name: string
  type: 'SELECT' | 'TEXT' | string
  url?: string | null
}

/** A value of a SELECT parameter. */
export type ParameterOption = { id: number; name: string }

/** A saved parameter row; the kind is under the endpoint's own field (e.g. connectionParameterType). */
export type ParameterRow = {
  id: number
  value?: string | null
  objectId?: number | null
  [field: string]: unknown
}

/**
 * Where one kind of parameter lives (the old AddParamComponent's props):
 * `base` — POST/GET/DELETE and `${base}/table`; `kindField` — the body field of the kind;
 * `parentField` — the body field of the owner; `filterField` — the table filter's owner key.
 */
export type ParameterEndpoint = {
  base: string
  enumUrl: string
  kindField: string
  parentField: string
  filterField: string
  /** Show the value through t() (some old panels did, e.g. filling and inserts parameters). */
  translateValue?: boolean
}

export const parameterKeys = {
  all: ['parameters'] as const,
  of: (base: string) => ['parameters', base] as const,
}

// Endpoints and bodies match the old panel (components/addParamComponent/addParamComponent.js).
export const parameterApi = {
  table: (base: string, body: TableBody, signal?: AbortSignal) =>
    api.post<TablePage<ParameterRow>>(`${base}/table`, body, { signal }).then((r) => r.data),

  get: (base: string, id: string, signal?: AbortSignal) =>
    api.get<ParameterRow>(`${base}/${id}`, { signal }).then((r) => r.data),

  kinds: (enumUrl: string, signal?: AbortSignal) =>
    api.get<ParameterKind[]>(enumUrl, { signal }).then((r) => r.data ?? []),

  options: (url: string, signal?: AbortSignal) =>
    api.get<ParameterOption[]>(url, { signal }).then((r) => r.data ?? []),

  /** Always POST, even on edit (with the id in the body), as the old panel did. */
  save: (base: string, body: object) => api.post(base, body),

  remove: (base: string, id: number) => api.delete(`${base}/${id}`),
}
