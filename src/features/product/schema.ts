import { z } from 'zod'
import { requiredNumber, requiredText } from '@/shared/lib/zod'
import type { ProductDetail } from './types'

const optionalNumber = () => z.number().nullable()

// ── Common to every group: the part of the form the shell (ProductFormPage) renders ──

/** Name, catalog name and article are required in every old product form. */
export const baseProductShape = {
  name: requiredText(),
  nameInCatalog: requiredText(),
  article: requiredText(),
  profileType: z.string().nullable(),
  unitId: z.number().nullable(),
  supplierId: z.number().nullable(),
  /** The saved drawing; kept unless a new file is chosen */
  drawingId: z.number().nullable(),
  drawing: z.instanceof(File).nullable(),
}

const baseSchema = z.object(baseProductShape)
export type BaseProductForm = z.input<typeof baseSchema>
/** What every group's validated values have at least: the shell reads these when saving. */
export type BaseProductValues = z.output<typeof baseSchema>

export const emptyBase = (): BaseProductForm => ({
  name: '',
  nameInCatalog: '',
  article: '',
  profileType: null,
  unitId: null,
  supplierId: null,
  drawingId: null,
  drawing: null,
})

export const baseToForm = (p: ProductDetail): BaseProductForm => ({
  name: p.name ?? '',
  nameInCatalog: p.nameInCatalog ?? '',
  article: p.article ?? '',
  profileType: p.profileType || null,
  unitId: p.unitId ?? null,
  supplierId: p.supplierId ?? null,
  drawingId: p.drawingId ?? null,
  drawing: null,
})

// ── Profiles (layout/product/profile/AddProfile.js) ──

/** Profile types that have their own extra field (the old form showed them only for these). */
export const TRACK_TYPES = ['FRAME']
export const SASH_CLEARANCE_TYPES = ['SASH', 'MULLION']

// The three sizes are required too; the rest may stay empty.
export const profileSchema = z
  .object({
    ...baseProductShape,
    productSeriesId: z.number().nullable(),
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
  ...emptyBase(),
  productSeriesId: null,
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
})

// ── Seals (layout/product/seal/AddSealType.js) ──

/** «Отход %» is required in the old seal form (any number, as there). */
export const sealSchema = z.object({
  ...baseProductShape,
  articleSpecificWeight: optionalNumber(),
  waste: requiredNumber(),
})

export type SealForm = z.input<typeof sealSchema>
export type SealValues = z.output<typeof sealSchema>

export const emptySeal = (): SealForm => ({
  ...emptyBase(),
  articleSpecificWeight: null,
  waste: null,
})

// ── Fillings (layout/product/filling/AddFillingType.js) ──

/** Sizes and «Отход %» are required in the old filling form. */
export const fillingSchema = z.object({
  ...baseProductShape,
  length: requiredNumber(),
  width: requiredNumber(),
  thickness: requiredNumber(),
  articleSpecificWeight: optionalNumber(),
  waste: requiredNumber(),
  needCuttingOptimization: z.boolean(),
})

export type FillingForm = z.input<typeof fillingSchema>
export type FillingValues = z.output<typeof fillingSchema>

export const emptyFilling = (): FillingForm => ({
  ...emptyBase(),
  length: null,
  width: null,
  thickness: null,
  articleSpecificWeight: null,
  waste: null,
  // Off for a new filling, as in the old form (profiles start with it on).
  needCuttingOptimization: false,
})

// ── Accessories (layout/product/accessories/AddAccessoriesType.js) ──

/** Fittings have a subtype; a handle (subtype HANDLE) has a handle picture. */
export const FITTINGS_TYPE = 'FITTINGS'
export const HANDLE_SUBTYPE = 'HANDLE'

export const accessoriesSchema = z.object({
  ...baseProductShape,
  articleSpecificWeight: optionalNumber(),
  subtype: z.string().nullable(),
  handleType: z.string().nullable(),
})

export type AccessoriesForm = z.input<typeof accessoriesSchema>
export type AccessoriesValues = z.output<typeof accessoriesSchema>

/** A new accessory starts with "" subtype and handle, as the old form did (they're sent so). */
export const emptyAccessories = (): AccessoriesForm => ({
  ...emptyBase(),
  articleSpecificWeight: null,
  subtype: '',
  handleType: '',
})
