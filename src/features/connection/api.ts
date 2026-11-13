import { api } from '@/shared/api/client'
import type { TableBody, TablePage } from '@/shared/api/table'
import type { ParameterEndpoint } from '@/shared/parameters'
import type { ConnectionSpecValues, ConnectionTypeValues, ConnectionValues } from './schema'
import type { Connection, ConnectionIcon, ConnectionSpecification, ConnectionType } from './types'

const all = ['connection'] as const
export const connectionKeys = {
  all,
  types: [...all, 'types'] as const,
  specs: [...all, 'specs'] as const,
}

const C = '/v1/connection'

// Endpoints and bodies match the old panel (layout/connection, components/connection).
export const connectionApi = {
  table: (body: TableBody, signal?: AbortSignal) =>
    api.post<TablePage<Connection>>(`${C}/table`, body, { signal }).then((r) => r.data),

  get: (id: string, signal?: AbortSignal) =>
    api.get<Connection>(`${C}/${id}`, { signal }).then((r) => r.data),

  /** Create without id (POST), update with id (PUT) — both on /v1/connection. */
  save: (values: ConnectionValues, id?: string) => {
    const body = { id: id ?? null, ...values }
    return id ? api.put(C, body) : api.post(C, body)
  },

  remove: (id: number) => api.delete(`${C}/${id}`),

  /** A copy of the connection (made on the server). */
  copy: (id: number) => api.post(`${C}/copy/${id}`),

  types: (body: TableBody, signal?: AbortSignal) =>
    api.post<TablePage<ConnectionType>>(`${C}/type/table`, body, { signal }).then((r) => r.data),

  icons: (signal?: AbortSignal) =>
    api
      .get<ConnectionIcon[]>(`${C}/type/enum/connection/type`, { signal })
      .then((r) => r.data ?? []),

  /** Variants are only added (the old panel had no edit). */
  addType: (connectionId: string, values: ConnectionTypeValues) =>
    api.post(`${C}/type`, { connectionId, ...values }),

  removeType: (id: number) => api.delete(`${C}/type/${id}`),

  specs: (body: TableBody, signal?: AbortSignal) =>
    api
      .post<TablePage<ConnectionSpecification>>(`${C}/specification/table`, body, { signal })
      .then((r) => r.data),

  spec: (id: string, signal?: AbortSignal) =>
    api.get<ConnectionSpecification>(`${C}/specification/${id}`, { signal }).then((r) => r.data),

  /** POST without id, PUT with it — both on /v1/connection/specification. */
  saveSpec: (connectionTypeId: number, values: ConnectionSpecValues, id?: string) => {
    const body = { id: id === undefined ? null : Number(id), ...values, connectionTypeId }
    return id === undefined
      ? api.post(`${C}/specification`, body)
      : api.put(`${C}/specification`, body)
  },

  removeSpec: (id: number) => api.delete(`${C}/specification/${id}`),
}

/** A variant's parameters. The table's filter key is «connectionId» though it is the variant's id (as before). */
export const TYPE_PARAMETERS: ParameterEndpoint = {
  base: `${C}/parameter`,
  enumUrl: `${C}/parameter/enum/connection/parameter/type`,
  kindField: 'connectionParameterType',
  parentField: 'connectionTypeId',
  filterField: 'connectionId',
}

/** A specification's parameters. */
export const SPEC_PARAMETERS: ParameterEndpoint = {
  base: `${C}/specification/parameter`,
  enumUrl: `${C}/specification/parameter/enum/specification/type`,
  kindField: 'specificationType',
  parentField: 'specificationId',
  filterField: 'specificationId',
}
