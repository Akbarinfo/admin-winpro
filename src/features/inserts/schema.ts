import { z } from 'zod'
import { requiredNumber, requiredText } from '@/shared/lib/zod'

/** The product that has inserts (the old ModalInserts); its name goes along, as before. */
export const consistSchema = z.object({
  productId: requiredNumber(),
  productName: z.string().nullable(),
})
export type ConsistForm = z.input<typeof consistSchema>
export type ConsistValues = z.output<typeof consistSchema>

/** An insert (the old ModalAddInsertsAdditional): the name required. */
export const additionalSchema = z.object({
  name: requiredText(),
  byDefault: z.boolean(),
  necessarily: z.boolean(),
})
export type AdditionalForm = z.input<typeof additionalSchema>
export type AdditionalValues = z.output<typeof additionalSchema>

/** A product (and its texture) of an insert's specification. */
export const additionalSpecSchema = z.object({
  productId: requiredNumber(),
  textureId: z.number().nullable(),
})
export type AdditionalSpecForm = z.input<typeof additionalSpecSchema>
export type AdditionalSpecValues = z.output<typeof additionalSpecSchema>

/** The product an insert is copied to. */
export const copyToProductSchema = z.object({ productId: requiredNumber() })
export type CopyToProductForm = z.input<typeof copyToProductSchema>
export type CopyToProductValues = z.output<typeof copyToProductSchema>
