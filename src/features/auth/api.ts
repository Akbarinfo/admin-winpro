import { api } from '@/shared/api/client'
import type { SessionUser } from '@/shared/store/session'
import type { ForgotPasswordInput, LoginInput, ResetPasswordInput } from './schema'

export type LoginResponse = { token: string; user: SessionUser }

// Endpoints and bodies match the old panel (pages/Login.js, layout/forgotPassword/*).
export const authApi = {
  login: (input: LoginInput) => api.post<LoginResponse>('/login', input).then((r) => r.data),

  forgotPassword: (input: ForgotPasswordInput) =>
    api.post('/forgot/password', input).then(() => undefined),

  resetPassword: ({ emailOrPhone, confirmCode, newPassword }: ResetPasswordInput) =>
    api.post('/reset/password', { emailOrPhone, confirmCode, newPassword }).then(() => undefined),
}
