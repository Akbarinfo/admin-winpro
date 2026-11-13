import { z } from 'zod'
import { requiredNumber, requiredText } from '@/shared/lib/zod'

const whole = () => z.number().int('validation.integer').nullable()

/**
 * A fitting set (the old AddAccessories). The old form required nothing; the name is required
 * here (a nameless set can't be found in the list). Handle side was a whole number (its input had step 1).
 */
export const accessorySchema = z.object({
  name: requiredText(),
  shortName: z.string().trim(),
  handleSide: whole(),
  maxHalfPerimeter: z.number().nullable(),
  maxHeight: z.number().nullable(),
  maxWidth: z.number().nullable(),
  maxSash: z.number().nullable(),
  accessoriesType: z.string().nullable(),
  openingType: z.string().nullable(),
  openingSide: z.string().nullable(),
  door: z.boolean(),
})
export type AccessoryForm = z.input<typeof accessorySchema>
export type AccessoryValues = z.output<typeof accessorySchema>

/** A specification row: a product and its texture; «default» only on the main tab. */
export const accessorySpecSchema = z.object({
  productId: requiredNumber(),
  textureId: z.number().nullable(),
  default: z.boolean(),
})
export type AccessorySpecForm = z.input<typeof accessorySpecSchema>
export type AccessorySpecValues = z.output<typeof accessorySpecSchema>

const requiredWhole = () => requiredNumber().pipe(z.number().int('validation.integer'))

/** A side limit (the old ModalAccessoriesDependLimit): all five whole numbers, all required. */
export const sideLimitSchema = z.object({
  minLength: requiredWhole(),
  maxLength: requiredWhole(),
  minCorner: requiredWhole(),
  maxCorner: requiredWhole(),
  number: requiredWhole(),
})
export type SideLimitForm = z.input<typeof sideLimitSchema>
export type SideLimitValues = z.output<typeof sideLimitSchema>

/** The accessory a specification row is copied to. */
export const copyToAccessorySchema = z.object({ accessoriesId: requiredNumber() })
export type CopyToAccessoryForm = z.input<typeof copyToAccessorySchema>
export type CopyToAccessoryValues = z.output<typeof copyToAccessorySchema>
