import { z } from 'zod'

// Messages are i18n keys; <Field> translates them.
const required = z.string().trim().min(1, 'validation.required')

export const loginSchema = z.object({
  username: required,
  password: z.string().min(1, 'validation.required'),
})
export type LoginInput = z.infer<typeof loginSchema>

export const forgotPasswordSchema = z.object({
  emailOrPhone: required,
})
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    emailOrPhone: required,
    confirmCode: required,
    newPassword: z.string().min(1, 'validation.required'),
    repeatPassword: z.string().min(1, 'validation.required'),
  })
  .refine((v) => v.newPassword === v.repeatPassword, {
    message: 'validation.password_mismatch',
    path: ['repeatPassword'],
  })
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
