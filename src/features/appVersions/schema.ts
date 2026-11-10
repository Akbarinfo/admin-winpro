import { z } from 'zod'
import { requiredText } from '@/shared/lib/zod'

export const appVersionSchema = z.object({
  platform: requiredText(),
  latestVersion: requiredText(),
  minVersion: z.string().trim(),
  forceUpdate: z.boolean(),
  storeUrl: z.string().trim(),
  releaseNotes: z.string(),
})

export type AppVersionForm = z.input<typeof appVersionSchema>
export type AppVersionValues = z.output<typeof appVersionSchema>
