import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { Spinner } from './Spinner'

const VARIANTS = {
  primary: 'bg-primary text-primary-fg hover:bg-primary-strong',
  outline: 'border border-line-strong bg-surface hover:border-primary hover:text-primary',
  ghost: 'text-muted hover:bg-surface-2 hover:text-fg',
  danger: 'bg-danger text-white hover:opacity-90',
}

const SIZES = {
  sm: 'h-[30px] px-2.5 text-[13px]',
  md: 'h-9 px-3.5',
  lg: 'h-[42px] px-[18px]',
}

type ButtonProps = ComponentProps<'button'> & {
  variant?: keyof typeof VARIANTS
  size?: keyof typeof SIZES
  /** Shows a spinner in place of the icon and disables the button. */
  loading?: boolean
  icon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  type = 'button',
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  )
}
