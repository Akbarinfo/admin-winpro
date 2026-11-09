import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib/cn'

type SelectProps = ComponentProps<'select'> & { invalid?: boolean }

/** Native select for short fixed lists (page size, status). For search or long lists use Combobox. */
export function Select({ invalid, className, children, ...rest }: SelectProps) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={cn(
        'h-9 w-full cursor-pointer appearance-none rounded-md border border-line-strong bg-surface pr-8 pl-3 outline-none',
        'bg-[length:5px_5px,5px_5px] bg-no-repeat [background-image:linear-gradient(45deg,transparent_50%,var(--muted)_50%),linear-gradient(135deg,var(--muted)_50%,transparent_50%)]',
        '[background-position:calc(100%-16px)_center,calc(100%-11px)_center]',
        'focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-soft)] disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-faint',
        invalid && 'border-danger',
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  )
}
