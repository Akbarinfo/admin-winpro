import { z } from 'zod'
import { requiredText } from '@/shared/lib/zod'

export const languageSchema = z.object({
  /** ru, uz, en… — the id; can't be changed after creation. */
  code: requiredText(),
  name: requiredText(),
  isDefault: z.boolean(),
  active: z.boolean(),
})

export type LanguageForm = z.input<typeof languageSchema>
export type LanguageValues = z.output<typeof languageSchema>
