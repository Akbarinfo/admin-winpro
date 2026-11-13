import { z } from 'zod'
import { requiredText } from '@/shared/lib/zod'

/**
 * A new WinPro product made from an Akfa one (the old AkfaCreateProductForm): name, article and
 * group type are required, and at least one texture.
 */
export const akfaProductSchema = z.object({
  name: requiredText(),
  article: requiredText(),
  articleGroupType: requiredText(),
  length: z.number().nonnegative('validation.non_negative').nullable(),
  unitId: z.number().nullable(),
  supplierId: z.number().nullable(),
  productSeriesId: z.number().nullable(),
  textureIds: z.array(z.number()).min(1, 'akfa.create.no_textures_selected'),
})

export type AkfaProductForm = z.input<typeof akfaProductSchema>
export type AkfaProductValues = z.output<typeof akfaProductSchema>

export const emptyAkfaProduct = (): AkfaProductForm => ({
  name: '',
  article: '',
  articleGroupType: 'PROFILES',
  length: null,
  unitId: null,
  supplierId: null,
  productSeriesId: null,
  textureIds: [],
})
