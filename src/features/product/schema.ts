import { z } from 'zod'
import { requiredNumber, requiredText } from '@/shared/lib/zod'

const optionalNumber = () => z.number().nullable()

/** Profile types that have their own extra field (the old form showed them only for these). */
export const TRACK_TYPES = ['FRAME']
export const SASH_CLEARANCE_TYPES = ['SASH', 'MULLION']

// The old form (layout/product/profile/AddProfile.js): name, catalog name, article and the three sizes
// are required; the rest may stay empty.
export const profileSchema = z
  .object({
    name: requiredText(),
    nameInCatalog: requiredText(),
    article: requiredText(),
    profileType: z.string().nullable(),
    productSeriesId: z.number().nullable(),
    unitId: z.number().nullable(),
    supplierId: z.number().nullable(),
    length: requiredNumber(),
    width: requiredNumber(),
    thickness: requiredNumber(),
    sizeB: optionalNumber(),
    sizeN: optionalNumber(),
    sizeF: optionalNumber(),
    /** Channels of a sliding frame — FRAME only */
    trackCount: optionalNumber(),
    /** SASH and MULLION only; empty — the system's value */
    sashClearance: optionalNumber(),
    comeIn: optionalNumber(),
    articleSpecificWeight: optionalNumber(),
    sectionArea: optionalNumber(),
    momentJx: optionalNumber(),
    momentJy: optionalNumber(),
    usefulPiece: optionalNumber(),
    wastePercent: optionalNumber(),
    isReinforced: z.boolean(),
    needCuttingOptimization: z.boolean(),
    isArcProfile: z.boolean(),
    /** The saved drawing; kept unless a new file is chosen */
    drawingId: z.number().nullable(),
    drawing: z.instanceof(File).nullable(),
  })
  // A hidden field is neither checked nor sent.
  .superRefine((v, ctx) => {
    const n = v.trackCount
    if (
      TRACK_TYPES.includes(v.profileType ?? '') &&
      n !== null &&
      !(Number.isInteger(n) && n >= 1 && n <= 10)
    )
      ctx.addIssue({ code: 'custom', path: ['trackCount'], message: 'product.track_count_range' })
  })
  .transform((v) => ({
    ...v,
    trackCount: TRACK_TYPES.includes(v.profileType ?? '') ? v.trackCount : null,
    sashClearance: SASH_CLEARANCE_TYPES.includes(v.profileType ?? '') ? v.sashClearance : null,
  }))

export type ProfileForm = z.input<typeof profileSchema>
export type ProfileValues = z.output<typeof profileSchema>

export const emptyProfile = (): ProfileForm => ({
  name: '',
  nameInCatalog: '',
  article: '',
  profileType: null,
  productSeriesId: null,
  unitId: null,
  supplierId: null,
  length: null,
  width: null,
  thickness: null,
  sizeB: null,
  sizeN: null,
  sizeF: null,
  trackCount: null,
  sashClearance: null,
  comeIn: null,
  articleSpecificWeight: null,
  sectionArea: null,
  momentJx: null,
  momentJy: null,
  usefulPiece: null,
  wastePercent: null,
  isReinforced: false,
  needCuttingOptimization: true,
  isArcProfile: false,
  drawingId: null,
  drawing: null,
})
