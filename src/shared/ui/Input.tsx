import { useState, type ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { IconButton } from './IconButton'

type InputProps = ComponentProps<'input'> & { invalid?: boolean }

export function Input({ invalid, className, ...rest }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        'h-9 w-full min-w-0 rounded-md border border-line-strong bg-surface px-3 outline-none transition-[border-color,box-shadow] placeholder:text-faint',
        'focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-soft)]',
        'disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-faint',
        // read-only keeps the value in the form (disabled fields are left out of the submit)
        'read-only:bg-surface-2 read-only:text-muted',
        invalid && 'border-danger focus:border-danger focus:shadow-[0_0_0_3px_var(--danger-soft)]',
        className,
      )}
      {...rest}
    />
  )
}

export function PasswordInput({ className, ...rest }: Omit<InputProps, 'type'>) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input {...rest} type={visible ? 'text' : 'password'} className={cn('pr-10', className)} />
      <IconButton
        label={t(visible ? 'common.hide_password' : 'common.show_password')}
        onClick={() => setVisible((v) => !v)}
        className="absolute top-0.5 right-0.5"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </IconButton>
    </div>
  )
}
