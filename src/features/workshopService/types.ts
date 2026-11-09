/** «How the price is applied», from /v1/workshop-service/calculation-type. */
export type CalculationType = { key: string; value: string }

/** From /v1/workshop-service/service-type. */
export type ServiceType = { id: string; name: string }

/** A workshop service as returned by /v1/workshop-service. */
export type WorkshopService = {
  id: number
  name: string
  /** Service type id */
  serviceType?: string | null
  calculationType?: CalculationType | null
  price?: number | null
  currency?: { id: number; name: string; symbol?: string } | null
}
