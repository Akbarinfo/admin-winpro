import { z } from 'zod'
import { requiredNumber, requiredText } from '@/shared/lib/zod'

export const salesCategorySchema = z.object({
  name: requiredText(),
  /** Not shown in the old form, but kept and sent back. */
  description: z.string(),
  /** Required in the old form; 0 is allowed. */
  price: requiredNumber().pipe(z.number().nonnegative('validation.positive')),
  currencyId: z.number().nullable(),
  freeForTariffs: z.array(z.string()),
  profileSystemIds: z.array(z.number()),
})

export type SalesCategoryForm = z.input<typeof salesCategorySchema>
export type SalesCategoryValues = z.output<typeof salesCategorySchema>
