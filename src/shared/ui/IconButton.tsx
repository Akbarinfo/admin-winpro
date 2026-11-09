import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib/cn'

type IconButtonProps = ComponentProps<'button'> & {
  /** Required: icon-only buttons need an accessible name. Also shown as a tooltip. */
  label: string
  tone?: 'default' | 'danger'
  bordered?: boolean
}

export function IconButton({
  label,
  tone = 'default',
  bordered = false,
  type = 'button',
  className,
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-grid size-8 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-fg',
        tone === 'danger' && 'hover:bg-danger-soft hover:text-danger',
        bordered && 'border border-line bg-surface',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
