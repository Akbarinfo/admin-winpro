import { z } from 'zod'
import { requiredNumber, requiredText } from '@/shared/lib/zod'

/** A filling group (the old AddFilling): name and clearance required; the clearance whole (its input had step 1). */
export const fillingGroupSchema = z.object({
  name: requiredText(),
  clearance: requiredNumber().pipe(z.number().int('validation.integer')),
  outer: z.boolean(),
  inner: z.boolean(),
})
export type FillingGroupForm = z.input<typeof fillingGroupSchema>
export type FillingGroupValues = z.output<typeof fillingGroupSchema>

/**
 * A product of the group's specification (the old AddSpecificationModal): thickness and product required.
 * The thickness can't be negative (the old input allowed it; a negative glass thickness means nothing).
 */
export const fillingSpecSchema = z.object({
  thickness: requiredNumber(),
  productId: requiredNumber(),
  textureId: z.number().nullable(),
})
export type FillingSpecForm = z.input<typeof fillingSpecSchema>
export type FillingSpecValues = z.output<typeof fillingSpecSchema>
