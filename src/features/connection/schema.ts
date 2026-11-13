import { z } from 'zod'
import { requiredNumber, requiredText } from '@/shared/lib/zod'

/** Two products joined (the old AddConnection). */
export const connectionSchema = z.object({
  product1: requiredNumber(),
  product2: requiredNumber(),
})
export type ConnectionForm = z.input<typeof connectionSchema>
export type ConnectionValues = z.output<typeof connectionSchema>

/** A variant (the old ModalConnectionType): name and priority required, the icon optional (as before). */
export const connectionTypeSchema = z.object({
  name: requiredText(),
  priority: requiredNumber(),
  connectionTypeIndex: z.number().nullable(),
  isDefault: z.boolean(),
})
export type ConnectionTypeForm = z.input<typeof connectionTypeSchema>
export type ConnectionTypeValues = z.output<typeof connectionTypeSchema>

/** A product (and its texture) of a variant's specification (the old ModalAddConnectionSpecification). */
export const connectionSpecSchema = z.object({
  productId: requiredNumber(),
  textureId: z.number().nullable(),
})
export type ConnectionSpecForm = z.input<typeof connectionSpecSchema>
export type ConnectionSpecValues = z.output<typeof connectionSpecSchema>
