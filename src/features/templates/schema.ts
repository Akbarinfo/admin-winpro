import { z } from 'zod'
import { requiredNumber, requiredText } from '@/shared/lib/zod'

// The old form required the name and the sizes (and crashed without a type: required here).
export const templateSchema = z.object({
  name: requiredText(),
  materialTypeId: requiredNumber(),
  width: requiredNumber(),
  height: requiredNumber(),
  /** From the constructor; not typed in. */
  area: z.number().nullable(),
  image: z.instanceof(File).nullable(),
  /** The drawing file (JSON), sent as it was chosen. */
  json: z.instanceof(File).nullable(),
})

export type TemplateForm = z.input<typeof templateSchema>
export type TemplateValues = z.output<typeof templateSchema>

export const emptyTemplate = (): TemplateForm => ({
  name: '',
  materialTypeId: null,
  width: null,
  height: null,
  area: null,
  image: null,
  json: null,
})
