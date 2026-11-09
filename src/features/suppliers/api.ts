import { api } from '@/shared/api/client'
import { multipartBody } from '@/shared/api/files'
import type { TableBody, TablePage } from '@/shared/api/table'
import type { SupplierValues } from './schema'
import type { Supplier, SupplierType } from './types'

export const supplierKeys = { all: ['supplier'] as const }

// Endpoints and bodies match the old panel (layout/supplier, services/supplierService.js).
export const supplierApi = {
  table: (body: TableBody, signal?: AbortSignal) =>
    api.post<TablePage<Supplier>>('/v1/supplier/table', body, { signal }).then((r) => r.data),

  get: (id: string, signal?: AbortSignal) =>
    api.get<Supplier>(`/v1/supplier/${id}`, { signal }).then((r) => r.data),

  /** Country names suppliers can be from (plain strings). */
  countries: (signal?: AbortSignal) =>
    api.get<string[]>('/v1/supplier/country', { signal }).then((r) => r.data),

  types: (signal?: AbortSignal) =>
    api.get<SupplierType[]>('/v1/supplier/enum/supplier/type', { signal }).then((r) => r.data),

  /**
   * multipart: «data» — the record as JSON, «image» — the new logo.
   * Create (POST) and update (PUT) both go to /v1/supplier, like the old panel.
   */
  save: ({ image, types, phone, country, ...rest }: SupplierValues, id?: string) => {
    const data = {
      id: id ?? null,
      name: rest.name,
      address: rest.address,
      phone: phone || null,
      currencyId: rest.currencyId,
      // Always the raw enum values. (The old panel sent translated names after removing a type — a bug.)
      types: types.length ? types.join(', ') : null,
      country: country ?? '',
      logoId: rest.logoId,
    }
    const body = multipartBody(data, image)
    return id ? api.put('/v1/supplier', body) : api.post('/v1/supplier', body)
  },

  remove: (id: number) => api.delete(`/v1/supplier/${id}`),
}
