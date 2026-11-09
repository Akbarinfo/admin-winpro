import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { isClientError } from '@/shared/api/errors'
import { Alert, Button, Field, Input } from '@/shared/ui'
import { authApi } from './api'
import { AuthCard } from './AuthCard'
import { forgotPasswordSchema, type ForgotPasswordInput } from './schema'

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { emailOrPhone: '' },
  })
  const { errors } = form.formState

  const sendCode = useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: (_, { emailOrPhone }) => {
      toast.success(t('auth.code_sent'))
      navigate('/reset-password', { state: { emailOrPhone } })
    },
  })

  return (
    <AuthCard
      back
      title={t('auth.forgot_title')}
      subtitle={t('auth.forgot_subtitle')}
      onSubmit={form.handleSubmit((values) => sendCode.mutate(values))}
    >
      {isClientError(sendCode.error) && <Alert>{sendCode.error.message}</Alert>}

      <Field
        label={t('auth.email_or_phone')}
        htmlFor="emailOrPhone"
        error={errors.emailOrPhone?.message}
      >
        <Input
          id="emailOrPhone"
          autoComplete="username"
          autoFocus
          invalid={!!errors.emailOrPhone}
          disabled={sendCode.isPending}
          {...form.register('emailOrPhone')}
        />
      </Field>

      <Button type="submit" size="lg" loading={sendCode.isPending}>
        {t(sendCode.isPending ? 'auth.sending' : 'auth.send_code')}
      </Button>
    </AuthCard>
  )
}
