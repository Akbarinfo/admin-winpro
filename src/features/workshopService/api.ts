import { api } from '@/shared/api/client'
import type { TableBody, TablePage } from '@/shared/api/table'
import type { WorkshopServiceValues } from './schema'
import type { CalculationType, ServiceType, WorkshopService } from './types'

export const workshopServiceKeys = { all: ['workshop-service'] as const }

// Endpoints and bodies match the old panel (layout/workshopService, services/workshopServiceService.js).
export const workshopServiceApi = {
  table: (body: TableBody, signal?: AbortSignal) =>
    api
      .post<TablePage<WorkshopService>>('/v1/workshop-service/table', body, { signal })
      .then((r) => r.data),

  get: (id: string, signal?: AbortSignal) =>
    api.get<WorkshopService>(`/v1/workshop-service/${id}`, { signal }).then((r) => r.data),

  calculationTypes: (signal?: AbortSignal) =>
    api
      .get<CalculationType[]>('/v1/workshop-service/calculation-type', { signal })
      .then((r) => r.data),

  serviceTypes: (signal?: AbortSignal) =>
    api.get<ServiceType[]>('/v1/workshop-service/service-type', { signal }).then((r) => r.data),

  /**
   * Create (POST) and update (PUT) both on /v1/workshop-service. Unlike other sections the old panel
   * sent the id as a number here, and an empty object for a missing calculation type.
   */
  save: (values: WorkshopServiceValues, id?: string) => {
    const body = {
      id: id ? Number(id) : null,
      name: values.name,
      calculationType: values.calculationType ? { key: values.calculationType } : {},
      price: values.price,
      currencyId: values.currencyId,
      serviceType: values.serviceType,
    }
    return id ? api.put('/v1/workshop-service', body) : api.post('/v1/workshop-service', body)
  },

  remove: (id: number) => api.delete(`/v1/workshop-service/${id}`),
}
