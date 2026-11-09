import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-[76ch] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Card({ className, ...rest }: ComponentProps<'div'>) {
  return (
    <div className={cn('min-w-0 rounded-lg border border-line bg-surface', className)} {...rest} />
  )
}

/**
 * List page frame: fills the scrolling <main>, so the page itself doesn't scroll —
 * only the table body inside a TableCard does, and the pagination stays visible.
 */
export function ListLayout({ children }: { children: ReactNode }) {
  return <div className="flex h-full min-h-0 flex-col">{children}</div>
}

/** Card for DataTable + Pagination: takes the remaining height and clips the header to the rounded corners. */
export function TableCard({ className, ...rest }: ComponentProps<'div'>) {
  return (
    <Card className={cn('flex min-h-0 flex-1 flex-col overflow-hidden', className)} {...rest} />
  )
}

const CHIP_TONES = {
  default: 'border border-line bg-surface-2 text-muted',
  primary: 'bg-primary-soft text-primary-strong',
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  danger: 'bg-danger-soft text-danger',
}

export function Chip({
  tone = 'default',
  className,
  ...rest
}: ComponentProps<'span'> & { tone?: keyof typeof CHIP_TONES }) {
  return (
    <span
      className={cn(
        'inline-flex h-[22px] items-center gap-1 rounded-md px-2 text-xs font-medium whitespace-nowrap',
        CHIP_TONES[tone],
        className,
      )}
      {...rest}
    />
  )
}
