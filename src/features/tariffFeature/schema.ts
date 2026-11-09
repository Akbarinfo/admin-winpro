import { z } from 'zod'
import { requiredText } from '@/shared/lib/zod'

export const tariffFeatureSchema = z.object({
  tariff: requiredText(),
  featureType: requiredText(),
  featureKey: requiredText(),
  featureLabel: requiredText(),
  value: requiredText(),
  unit: z.string().trim(),
  sortOrder: z.number().int().nullable(),
})

export type TariffFeatureForm = z.input<typeof tariffFeatureSchema>
export type TariffFeatureValues = z.output<typeof tariffFeatureSchema>
