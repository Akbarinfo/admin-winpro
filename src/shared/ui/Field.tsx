import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

type FieldProps = {
  label: string
  htmlFor: string
  /** An i18n key (from a zod schema) or a ready message (from the backend). */
  error?: string
  hint?: string
  required?: boolean
  /** Rendered on the right of the label, e.g. a «Forgot password?» link. */
  labelAside?: ReactNode
  children: ReactNode
}

export function Field({ label, htmlFor, error, hint, required, labelAside, children }: FieldProps) {
  const { t } = useTranslation()

  return (
    <div className="grid min-w-0 gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={htmlFor} className="text-[12.5px] font-medium text-muted">
          {label}
          {required && <span className="text-danger"> *</span>}
        </label>
        {labelAside}
      </div>
      {children}
      {error ? (
        <span id={`${htmlFor}-error`} className="text-xs text-danger">
          {t(error)}
        </span>
      ) : (
        hint && <span className="text-xs text-faint">{hint}</span>
      )}
    </div>
  )
}
