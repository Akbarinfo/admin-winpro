import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export function Textarea({
  invalid,
  className,
  ...rest
}: ComponentProps<'textarea'> & { invalid?: boolean }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(
        'min-h-[84px] w-full resize-y rounded-md border border-line-strong bg-surface px-3 py-2 outline-none placeholder:text-faint',
        'focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-soft)] disabled:bg-surface-2 disabled:text-faint',
        invalid && 'border-danger',
        className,
      )}
      {...rest}
    />
  )
}

type CheckProps = Omit<ComponentProps<'input'>, 'type'> & { label: ReactNode }

export function Checkbox({ label, className, ...rest }: CheckProps) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-2 select-none', className)}>
      <input type="checkbox" className="size-4 accent-primary" {...rest} />
      {label}
    </label>
  )
}

/** On/off setting that applies immediately. For a form value that is saved later, prefer Checkbox. */
export function Switch({ label, className, ...rest }: CheckProps) {
  return (
    <label
      className={cn(
        'relative inline-flex cursor-pointer items-center gap-2.5 select-none',
        className,
      )}
    >
      <input type="checkbox" role="switch" className="peer sr-only" {...rest} />
      <span
        aria-hidden="true"
        className={cn(
          'relative h-5 w-[34px] rounded-full bg-line-strong transition-colors peer-checked:bg-primary',
          'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary',
          'after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-white after:transition-transform',
          'peer-checked:after:translate-x-3.5',
        )}
      />
      {label}
    </label>
  )
}
