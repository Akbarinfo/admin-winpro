import type { ComponentProps, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

type AuthCardProps = ComponentProps<'form'> & {
  title: string
  subtitle?: ReactNode
  /** Shows «Back to sign in» above the title. */
  back?: boolean
}

/** Shared frame for every auth screen: optional back link, title, subtitle, then the form body. */
export function AuthCard({ title, subtitle, back, className, children, ...rest }: AuthCardProps) {
  const { t } = useTranslation()

  return (
    <form noValidate className={cn('grid w-full max-w-[380px] gap-[22px]', className)} {...rest}>
      {back && (
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 justify-self-start font-medium text-primary-strong hover:underline"
        >
          <ChevronLeft size={16} aria-hidden="true" />
          {t('auth.back_to_login')}
        </Link>
      )}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-1.5 text-muted">{subtitle}</p>}
      </div>
      {children}
    </form>
  )
}
