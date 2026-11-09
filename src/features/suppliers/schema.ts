import { z } from 'zod'
import { requiredText } from '@/shared/lib/zod'
import { isPhoneComplete, type PhoneFormat } from '@/shared/ui/helpers'

/** The phone is checked against the countries from /v1/country/list, so the schema is built with them. */
export const supplierSchema = (countries: PhoneFormat[]) =>
  z.object({
    name: requiredText(),
    address: z.string().trim(),
    /** Empty, or a complete number in its country's format: «+998 (90) 123 45 67». */
    phone: z.string().refine((v) => v === '' || isPhoneComplete(v, countries), 'validation.phone'),
    country: z.string().nullable(),
    currencyId: z.number().nullable(),
    /** Enum values, e.g. ['PROFILES', 'FITTINGS']. */
    types: z.array(z.string()),
    /** Logo already on the server; kept when no new image is chosen. */
    logoId: z.number().nullable(),
    /** Newly chosen logo. */
    image: z.instanceof(File).nullable(),
  })

export type SupplierForm = z.input<ReturnType<typeof supplierSchema>>
export type SupplierValues = z.output<ReturnType<typeof supplierSchema>>
