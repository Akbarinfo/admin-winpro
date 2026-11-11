import { z } from 'zod'
import { requiredText } from '@/shared/lib/zod'

/**
 * A key and its text in every active language — all required, as the old form's fields were.
 * The languages come from the backend, so the schema is built for them.
 */
export const translationSchema = (codes: string[]) =>
  z.object({
    key: requiredText(),
    values: z.object(
      Object.fromEntries(
        codes.map((code) => [
          code,
          // kept as typed (the old form didn't trim the texts), but not blank; a language the
          // record has no text for yet comes as undefined — the same «required»
          z
            .string()
            .optional()
            .refine((v) => !!v && v.trim() !== '', 'validation.required')
            .transform((v) => v ?? ''),
        ]),
      ),
    ),
  })

export type TranslationForm = { key: string; values: Record<string, string> }
export type TranslationValues = { key: string; values: Record<string, string> }
