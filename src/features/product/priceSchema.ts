import { z } from 'zod'
import { requiredNumber, requiredText } from '@/shared/lib/zod'

// The old price form (components/product/ModalPrice.js): date, price and price of one are required.
// Texture and currency are required here too: a price without them can't be shown or used.
export const priceSchema = z.object({
  /** «YYYY-MM-DD» from <input type="date"> */
  date: requiredText(),
  textureId: requiredNumber(),
  price: requiredNumber().pipe(z.number().nonnegative('validation.positive')),
  priceOfOne: requiredNumber().pipe(z.number().nonnegative('validation.positive')),
  currencyId: requiredNumber(),
  countryId: z.number().nullable(),
})

export type PriceForm = z.input<typeof priceSchema>
export type PriceValues = z.output<typeof priceSchema>
