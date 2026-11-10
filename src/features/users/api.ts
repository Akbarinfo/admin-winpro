import { api } from '@/shared/api/client'
import { multipartBody } from '@/shared/api/files'
import type { TableBody, TablePage } from '@/shared/api/table'
import type { UserValues } from './schema'
import { SUPPLIER_ROLES, type SupplierOption, type User, type UserRole } from './types'

export const userKeys = { all: ['user'] as const }

// Endpoints and bodies match the old panel (layout/user, services/userService.js).
export const userApi = {
  table: (body: TableBody, signal?: AbortSignal) =>
    api.post<TablePage<User>>('/v1/user/table', body, { signal }).then((r) => r.data),

  get: (id: string, signal?: AbortSignal) =>
    api.get<User>(`/v1/user/${id}`, { signal }).then((r) => r.data),

  roles: (signal?: AbortSignal) =>
    api.get<UserRole[]>('/v1/user/enum/role/type', { signal }).then((r) => r.data),

  /** All suppliers by name, for supplier staff — the same request as the old panel. */
  suppliers: (signal?: AbortSignal) =>
    api
      .post<TablePage<SupplierOption>>(
        '/v1/supplier/table',
        {
          draw: 1,
          start: 0,
          length: 1000,
          recordsTotal: 0,
          columns: [],
          order: [{ column: 'name', dir: 'ASC' }],
          search: { value: '', regex: false },
          filter: {},
        },
        { signal },
      )
      .then((r) => r.data.data.map((s) => ({ id: s.id, name: s.name }))),

  /**
   * multipart: «data» — the user as JSON, «image» — the new photo. POST and PUT both on /v1/user/
   * (with the trailing slash, as in the old panel). The id goes as the URL string, like before.
   * Passwords exactly as the old form sent them: a new user — password, newPassword null;
   * an edit — password "" (the backend rejects null) and newPassword as typed, "" to keep the old one.
   */
  save: ({ image, ...values }: UserValues, id?: string) => {
    const data = {
      id: id ?? null,
      fullName: values.fullName,
      username: values.username,
      phone: values.phone,
      role: values.role,
      password: id ? '' : values.password,
      newPassword: id ? values.newPassword : null,
      imageId: values.imageId,
      supplierId: SUPPLIER_ROLES.includes(values.role) ? values.supplierId : null,
    }
    const body = multipartBody(data, image)
    return id ? api.put('/v1/user/', body) : api.post('/v1/user/', body)
  },

  remove: (id: number) => api.delete(`/v1/user/${id}`),
}
