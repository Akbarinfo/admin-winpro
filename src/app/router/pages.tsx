import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useRouteError } from 'react-router'
import { Construction, RefreshCw, TriangleAlert } from 'lucide-react'
import { Button, Spinner } from '@/shared/ui'
import { findNavItem } from '../layout/nav'

function Message({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode
  title: string
  text: string
  action?: ReactNode
}) {
  return (
    <div className="mx-auto grid max-w-[460px] justify-items-center gap-3 py-16 text-center">
      <span className="grid size-[52px] place-items-center rounded-[14px] bg-primary-soft text-primary">
        {icon}
      </span>
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-muted">{text}</p>
      {action}
    </div>
  )
}

/** Placeholder for menu sections that haven't been migrated yet. */
export function ComingSoonPage() {
  const { t } = useTranslation()
  const item = findNavItem(useLocation().pathname)

  return (
    <>
      {item && <h1 className="mb-5 text-2xl font-semibold tracking-tight">{t(item.label)}</h1>}
      <div className="rounded-lg border border-line bg-surface">
        <Message icon={<Construction size={26} />} title={t('soon.title')} text={t('soon.text')} />
      </div>
    </>
  )
}

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <Message
      icon={<TriangleAlert size={26} />}
      title={t('errors.not_found_title')}
      text={t('errors.not_found_text')}
      action={
        <Link to="/" className="font-medium text-primary-strong hover:underline">
          {t('common.to_home')}
        </Link>
      }
    />
  )
}

/** Router errorElement: an unexpected render error replaces the page instead of a blank screen. */
export function ErrorScreen() {
  const { t } = useTranslation()
  const error = useRouteError()
  if (import.meta.env.DEV) console.error(error)

  return (
    <Message
      icon={<TriangleAlert size={26} />}
      title={t('errors.crash_title')}
      text={t('errors.crash_text')}
      action={
        <Button icon={<RefreshCw size={16} />} onClick={() => window.location.reload()}>
          {t('common.reload')}
        </Button>
      }
    />
  )
}

/** First load straight onto a page whose code isn't loaded yet (a link, a refresh). */
export function PageLoading() {
  const { t } = useTranslation()
  return (
    <div role="status" className="grid h-dvh place-items-center text-primary">
      <Spinner className="size-7" />
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  )
}
