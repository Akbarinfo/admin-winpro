import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { CircleCheck } from 'lucide-react'
import { isClientError } from '@/shared/api/errors'
import { Alert, Button, Field, Input, PasswordInput } from '@/shared/ui'
import { authApi } from './api'
import { AuthCard } from './AuthCard'
import { resetPasswordSchema, type ResetPasswordInput } from './schema'

export function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  // Filled in by ForgotPasswordPage; empty if the page is opened directly.
  const emailOrPhone = (location.state as { emailOrPhone?: string } | null)?.emailOrPhone ?? ''

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { emailOrPhone, confirmCode: '', newPassword: '', repeatPassword: '' },
  })
  const { errors } = form.formState

  const reset = useMutation({ mutationFn: authApi.resetPassword })

  if (reset.isSuccess) {
    return (
      <AuthCard
        title={t('auth.done_title')}
        subtitle={t('auth.done_text')}
        onSubmit={(e) => e.preventDefault()}
      >
        <span className="order-first grid size-[52px] place-items-center rounded-[14px] bg-ok-soft text-ok">
          <CircleCheck size={26} aria-hidden="true" />
        </span>
        <Button size="lg" onClick={() => navigate('/login', { replace: true })}>
          {t('auth.go_login')}
        </Button>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      back
      title={t('auth.reset_title')}
      subtitle={t('auth.reset_subtitle')}
      onSubmit={form.handleSubmit((values) => reset.mutate(values))}
    >
      {isClientError(reset.error) && <Alert>{reset.error.message}</Alert>}

      <Field
        label={t('auth.email_or_phone')}
        htmlFor="emailOrPhone"
        error={errors.emailOrPhone?.message}
      >
        <Input
          id="emailOrPhone"
          autoComplete="username"
          invalid={!!errors.emailOrPhone}
          disabled={reset.isPending}
          {...form.register('emailOrPhone')}
        />
      </Field>

      <Field
        label={t('auth.confirm_code')}
        htmlFor="confirmCode"
        error={errors.confirmCode?.message}
      >
        <Input
          id="confirmCode"
          autoComplete="one-time-code"
          inputMode="numeric"
          autoFocus={!!emailOrPhone}
          invalid={!!errors.confirmCode}
          disabled={reset.isPending}
          {...form.register('confirmCode')}
        />
      </Field>

      <Field
        label={t('auth.new_password')}
        htmlFor="newPassword"
        error={errors.newPassword?.message}
      >
        <PasswordInput
          id="newPassword"
          autoComplete="new-password"
          invalid={!!errors.newPassword}
          disabled={reset.isPending}
          {...form.register('newPassword')}
        />
      </Field>

      <Field
        label={t('auth.repeat_password')}
        htmlFor="repeatPassword"
        error={errors.repeatPassword?.message}
      >
        <PasswordInput
          id="repeatPassword"
          autoComplete="new-password"
          invalid={!!errors.repeatPassword}
          disabled={reset.isPending}
          {...form.register('repeatPassword')}
        />
      </Field>

      <Button type="submit" size="lg" loading={reset.isPending}>
        {t(reset.isPending ? 'auth.saving' : 'auth.save_password')}
      </Button>
    </AuthCard>
  )
}
