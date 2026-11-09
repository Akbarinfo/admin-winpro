import { z } from 'zod'

// Form-friendly schema pieces. Form state allows null («nothing chosen yet»),
// the validated output doesn't — so the API layer gets plain numbers.
// Messages are i18n keys; <Field> translates them.

/** Required number (id from a Combobox, amount from a NumberInput): number | null → number. */
export const requiredNumber = () =>
  z
    .number()
    .nullable()
    .transform((value, ctx) => {
      if (value === null) {
        ctx.addIssue({ code: 'custom', message: 'validation.required' })
        return z.NEVER
      }
      return value
    })

/** Required number greater than zero (price, rate). */
export const positiveNumber = () =>
  requiredNumber().pipe(z.number().positive('validation.positive'))

/** Required trimmed text. */
export const requiredText = () => z.string().trim().min(1, 'validation.required')
