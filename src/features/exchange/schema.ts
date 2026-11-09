import { z } from 'zod'
import { positiveNumber, requiredNumber, requiredText } from '@/shared/lib/zod'

export const exchangeSchema = z
  .object({
    fromCurrencyId: requiredNumber(),
    toCurrencyId: requiredNumber(),
    rate: positiveNumber(),
    /** «YYYY-MM-DD» from <input type="date"> */
    date: requiredText(),
  })
  .refine((v) => v.fromCurrencyId !== v.toCurrencyId, {
    message: 'validation.same_currency',
    path: ['toCurrencyId'],
  })

/** Form state: ids and rate may be null until chosen. */
export type ExchangeForm = z.input<typeof exchangeSchema>
/** Validated values sent to the API. */
export type ExchangeValues = z.output<typeof exchangeSchema>
