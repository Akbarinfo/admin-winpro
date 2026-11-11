import { api } from '@/shared/api/client'
import type { PriceRequestPage, RequestStatus } from './types'

export const priceRequestKeys = { all: ['price-requests'] as const }

export type PriceRequestQuery = {
  /** 0-based, as the backend counts */
  page: number
  size: number
  status: RequestStatus | null
  search: string
}

// Endpoints match the old panel (services/priceRequestService.js). Not a DataTables /table endpoint:
// a plain GET with page/size/status/search, empty ones left out.
export const priceRequestApi = {
  list: ({ page, size, status, search }: PriceRequestQuery, signal?: AbortSignal) =>
    api
      .get<PriceRequestPage>('/v1/price-requests', {
        params: { page, size, ...(status && { status }), ...(search && { search }) },
        signal,
      })
      .then((r) => r.data),

  approve: (id: number) => api.put(`/v1/price-requests/${id}/approve`),

  reject: (id: number, rejectReason: string) =>
    api.put(`/v1/price-requests/${id}/reject`, { rejectReason }),
}
