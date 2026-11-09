import { z } from 'zod'
import { requiredNumber, requiredText } from '@/shared/lib/zod'

export const textureSchema = z.object({
  name: requiredText(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, 'validation.color'),
  priority: requiredNumber().pipe(z.number().int()),
  /** Laminated on both sides */
  isDouble: z.boolean(),
  /** Image already on the server; kept when no new one is chosen. */
  imageId: z.number().nullable(),
  image: z.instanceof(File).nullable(),
})
export type TextureForm = z.input<typeof textureSchema>
export type TextureValues = z.output<typeof textureSchema>

export const matchSchema = z.object({
  matchingTextureId: requiredNumber(),
  matchingSideType: z
    .string()
    .nullable()
    .refine((v) => !!v, 'validation.required'),
})
export type MatchForm = z.input<typeof matchSchema>
export type MatchValues = z.output<typeof matchSchema>
