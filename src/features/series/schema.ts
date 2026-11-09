import { z } from 'zod'
import { requiredText } from '@/shared/lib/zod'

export const seriesSchema = z.object({
  name: requiredText(),
  description: z.string().trim(),
})

export type SeriesForm = z.input<typeof seriesSchema>
export type SeriesValues = z.output<typeof seriesSchema>
