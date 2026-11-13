import { z } from 'zod'

/**
 * A parameter: its kind is required; a SELECT kind needs a chosen value, a TEXT kind a typed one.
 * `value` is what is sent either way (a SELECT's chosen name, as the old panel sent it).
 */
export const parameterSchema = z
  .object({
    kind: z.string().nullable(),
    kindType: z.string().nullable(),
    objectId: z.number().nullable(),
    value: z.string().trim(),
  })
  .superRefine((v, ctx) => {
    if (!v.kind) ctx.addIssue({ code: 'custom', path: ['kind'], message: 'validation.required' })
    else if (v.kindType === 'SELECT' && v.objectId === null)
      ctx.addIssue({ code: 'custom', path: ['objectId'], message: 'validation.required' })
    else if (v.kindType !== 'SELECT' && !v.value)
      ctx.addIssue({ code: 'custom', path: ['value'], message: 'validation.required' })
  })

export type ParameterForm = z.input<typeof parameterSchema>
export type ParameterValues = z.output<typeof parameterSchema>
