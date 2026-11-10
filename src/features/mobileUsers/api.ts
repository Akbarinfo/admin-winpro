import { api } from '@/shared/api/client'
import type { TableBody, TablePage } from '@/shared/api/table'
import type { MobileUser } from './types'

export const mobileUserKeys = { all: ['mobile-user'] as const }

// Endpoints and bodies match the old panel (layout/mobileUser/MobileUser.js).
export const mobileUserApi = {
  table: (body: TableBody, signal?: AbortSignal) =>
    api.post<TablePage<MobileUser>>('/v2/mobile-user/table', body, { signal }).then((r) => r.data),

  /** Marks the user as checked; there is no way back in the old panel either. */
  check: (id: number) => api.put('/v1/mobile-user/update/is-checked', { id, isChecked: true }),
}
