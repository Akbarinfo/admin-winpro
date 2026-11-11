import { z } from 'zod'
import { requiredNumber, requiredText } from '@/shared/lib/zod'

// The old form required the name and the three sizes; the rest could stay empty.
export const drawingTemplateSchema = z.object({
  name: requiredText(),
  type: z.string().nullable(),
  profileSystemId: z.number().nullable(),
  textureId: z.number().nullable(),
  width: requiredNumber(),
  height: requiredNumber(),
  area: requiredNumber(),
  image: z.instanceof(File).nullable(),
  /** The drawing file (JSON), sent as it was chosen. */
  json: z.instanceof(File).nullable(),
})

export type DrawingTemplateForm = z.input<typeof drawingTemplateSchema>
export type DrawingTemplateValues = z.output<typeof drawingTemplateSchema>

export const emptyDrawingTemplate = (): DrawingTemplateForm => ({
  name: '',
  type: null,
  profileSystemId: null,
  textureId: null,
  width: null,
  height: null,
  area: null,
  image: null,
  json: null,
})
