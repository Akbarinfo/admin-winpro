import { z } from 'zod'
import { requiredText } from '@/shared/lib/zod'

export const VISIBILITIES = ['PUBLIC', 'PRIVATE']
/** Used until the backend's enum lists load (and if they fail), as the old modal did. */
export const SLIDING_TYPE_FALLBACK = ['NONE', 'FRAME_PER_TRACK', 'MULTI_TRACK_FRAME']
export const CLIENT_SCOPE_FALLBACK = ['ALL', 'V2_ONLY']
/** Placeholders: the values the backend uses when the field is empty. */
export const DEFAULT_SASH_CLEARANCE = 12
export const DEFAULT_MAX_TRACK_COUNT = 5

// The old modal (components/profileSystem/ModalAddProfileSystem.js) required only the name.
export const profileSystemSchema = z
  .object({
    name: requiredText(),
    /** The parent system; chosen only for a new one */
    parentId: z.number().nullable(),
    fillingGroupId: z.number().nullable(),
    defaultGlassId: z.number().nullable(),
    defaultPanelId: z.number().nullable(),
    materialTypeId: z.number().nullable(),
    supplierId: z.number().nullable(),
    visibility: z.string(),
    slidingType: z.string(),
    clientScope: z.string(),
    sashClearance: z.number().nonnegative('validation.non_negative').nullable(),
    /** Only for FRAME_PER_TRACK; checked only then (the field is hidden otherwise) */
    maxTrackCount: z.number().nullable(),
    isVisible: z.boolean(),
    isDefault: z.boolean(),
    isTesting: z.boolean(),
    image: z.instanceof(File).nullable(),
  })
  .superRefine((v, ctx) => {
    const n = v.maxTrackCount
    if (
      v.slidingType === 'FRAME_PER_TRACK' &&
      n !== null &&
      !(Number.isInteger(n) && n >= 1 && n <= 10)
    )
      ctx.addIssue({
        code: 'custom',
        path: ['maxTrackCount'],
        message: 'profileSystems.track_range',
      })
  })

export type ProfileSystemForm = z.input<typeof profileSystemSchema>
export type ProfileSystemValues = z.output<typeof profileSystemSchema>

export const emptyProfileSystem = (): ProfileSystemForm => ({
  name: '',
  parentId: null,
  fillingGroupId: null,
  defaultGlassId: null,
  defaultPanelId: null,
  materialTypeId: null,
  supplierId: null,
  visibility: 'PUBLIC',
  slidingType: 'NONE',
  clientScope: 'ALL',
  sashClearance: null,
  maxTrackCount: null,
  isVisible: false,
  isDefault: false,
  isTesting: false,
  image: null,
})
