import { z } from 'zod'
import { requiredText } from '@/shared/lib/zod'

export const unitSchema = z.object({
  name: requiredText(),
  shortName: requiredText(),
})

export type UnitForm = z.input<typeof unitSchema>
export type UnitValues = z.output<typeof unitSchema>
