import { z } from 'zod'
import { requiredNumber, requiredText } from '@/shared/lib/zod'
import { PROVIDERS } from './types'

/** S3/MinIO bucket name rule — the same as the backend's. */
export const BUCKET_REGEX = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/

const count = () => requiredNumber().pipe(z.number().int().nonnegative('validation.positive'))

export const countrySchema = z.object({
  name: requiredText(),
  code: requiredText(),
  phoneCode: requiredText(),
  phoneFormat: requiredText(),
  digitsLength: count(),
  length: count(),
  codeSlice: requiredText(),
  currencyId: z.number().nullable(),
  /** Empty — the shared bucket. Stored trimmed and in lower case. */
  storageBucket: z
    .string()
    .transform((v) => v.trim().toLowerCase())
    .refine((v) => v === '' || BUCKET_REGEX.test(v), 'countries.bucket_errors.invalid'),
  isActive: z.boolean(),
  isDefault: z.boolean(),
  /** Newly chosen flag image. */
  file: z.instanceof(File).nullable(),
})

export type CountryForm = z.input<typeof countrySchema>
export type CountryValues = z.output<typeof countrySchema>

export const providerSchema = z.object({
  provider: z.enum(PROVIDERS),
  sortOrder: requiredNumber().pipe(z.number().int()),
  isActive: z.boolean(),
})

export type ProviderForm = z.input<typeof providerSchema>
export type ProviderValues = z.output<typeof providerSchema>
