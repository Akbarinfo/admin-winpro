import { z } from 'zod'
import { requiredText } from '@/shared/lib/zod'

export const workshopServiceSchema = z.object({
  name: requiredText(),
  /** CalculationType.key */
  calculationType: z.string().nullable(),
  price: z.number().nonnegative('validation.positive').nullable(),
  currencyId: z.number().nullable(),
  /** ServiceType.id */
  serviceType: z.string().nullable(),
})

export type WorkshopServiceForm = z.input<typeof workshopServiceSchema>
export type WorkshopServiceValues = z.output<typeof workshopServiceSchema>
