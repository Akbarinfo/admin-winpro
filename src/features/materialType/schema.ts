import { z } from 'zod'
import { requiredText } from '@/shared/lib/zod'

export const materialTypeSchema = z.object({
  name: requiredText(),
  description: z.string().trim(),
  isDefault: z.boolean(),
  /** Visible to everyone with a TEST badge while not fully verified. */
  isTesting: z.boolean(),
})

export type MaterialTypeForm = z.input<typeof materialTypeSchema>
export type MaterialTypeValues = z.output<typeof materialTypeSchema>
