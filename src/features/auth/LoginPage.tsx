import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router'
import { isClientError } from '@/shared/api/errors'
import { useSession } from '@/shared/store/session'
import { Alert, Button, Field, Input, PasswordInput } from '@/shared/ui'
import { authApi } from './api'
import { AuthCard } from './AuthCard'
import { loginSchema, type LoginInput } from './schema'

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const startSession = useSession((s) => s.login)

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })
  const { errors } = form.formState

  const login = useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ token, user }) => {
      startSession(token, user)
      // Back to the page the guard sent us away from, if any.
      const from = (location.state as { from?: string } | null)?.from
      navigate(from ?? '/', { replace: true })
    },
  })

  return (
    <AuthCard
      title={t('auth.login_title')}
      subtitle={t('auth.login_subtitle')}
      onSubmit={form.handleSubmit((values) => login.mutate(values))}
    >
      {isClientError(login.error) && <Alert>{login.error.message}</Alert>}

      <Field label={t('auth.username')} htmlFor="username" error={errors.username?.message}>
        <Input
          id="username"
          autoComplete="username"
          autoFocus
          invalid={!!errors.username}
          disabled={login.isPending}
          {...form.register('username')}
        />
      </Field>

      <Field
        label={t('auth.password')}
        htmlFor="password"
        error={errors.password?.message}
        labelAside={
          <Link
            to="/forgot-password"
            className="text-[12.5px] font-medium text-primary-strong hover:underline"
          >
            {t('auth.forgot_link')}
          </Link>
        }
      >
        <PasswordInput
          id="password"
          autoComplete="current-password"
          invalid={!!errors.password}
          disabled={login.isPending}
          {...form.register('password')}
        />
      </Field>

      <Button type="submit" size="lg" loading={login.isPending}>
        {t(login.isPending ? 'auth.submitting' : 'auth.submit')}
      </Button>
    </AuthCard>
  )
}
