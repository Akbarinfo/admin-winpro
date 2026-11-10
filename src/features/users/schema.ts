import { z } from 'zod'
import { requiredText } from '@/shared/lib/zod'
import { isPhoneComplete, type PhoneFormat } from '@/shared/ui/helpers'
import { SUPPLIER_ROLES } from './types'

/**
 * Built with the phone countries (for the phone check) and the mode:
 * a new user needs a password, an existing one can get a new password.
 */
export const userSchema = (countries: PhoneFormat[], isEdit: boolean) =>
  z
    .object({
      fullName: requiredText(),
      username: requiredText().pipe(z.email('validation.email')),
      phone: z
        .string()
        .refine((v) => v === '' || isPhoneComplete(v, countries), 'validation.phone'),
      // Sent exactly as typed (the old panel didn't trim it): spaces are part of a password.
      password: isEdit
        ? z.string()
        : z.string().refine((v) => v.trim() !== '', 'validation.required'),
      newPassword: z.string(),
      role: requiredText(),
      supplierId: z.number().nullable(),
      /** Photo already on the server; kept when no new image is chosen. */
      imageId: z.number().nullable(),
      /** Newly chosen photo. */
      image: z.instanceof(File).nullable(),
    })
    .refine((v) => !SUPPLIER_ROLES.includes(v.role) || v.supplierId !== null, {
      path: ['supplierId'],
      message: 'validation.required',
    })

export type UserForm = z.input<ReturnType<typeof userSchema>>
export type UserValues = z.output<ReturnType<typeof userSchema>>
