import { z } from 'zod'
import { requiredText } from '@/shared/lib/zod'

export const currencySchema = z.object({
  name: requiredText(),
  symbol: requiredText(),
  /** The country's base currency; exchange rates default to it. */
  isMain: z.boolean(),
})

export type CurrencyForm = z.input<typeof currencySchema>
export type CurrencyValues = z.output<typeof currencySchema>
