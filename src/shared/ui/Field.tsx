import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Info } from 'lucide-react'

type FieldProps = {
  label: string
  htmlFor: string
  /** An i18n key (from a zod schema) or a ready message (from the backend). */
  error?: string
  /** Line under the control. Use for what the user must know while typing (a format). */
  hint?: string
  /** Background explanation: an ⓘ next to the label, shown on hover/focus. Takes no space. */
  tip?: string
  required?: boolean
  /** Rendered on the right of the label, e.g. a «Forgot password?» link. */
  labelAside?: ReactNode
  children: ReactNode
}

/**
 * Label + control + one line under it.
 * - content-start: fields side by side stay aligned even when one of them is taller (has a hint).
 * - One minmax(0, 1fr) column: a control with a wide natural size (an input) can't push past its column.
 * - The error never moves the layout: with a hint it takes the hint's line; without one it hangs
 *   below the control (absolute), in the gap to the next field.
 */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  tip,
  required,
  labelAside,
  children,
}: FieldProps) {
  const { t } = useTranslation()

  return (
    <div className="relative grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1">
          <label htmlFor={htmlFor} className="text-[12.5px] font-medium text-muted">
            {label}
            {required && <span className="text-danger"> *</span>}
          </label>
          {tip && (
            <span
              tabIndex={0}
              role="img"
              aria-label={tip}
              data-tip={tip}
              className="group relative inline-grid size-4 place-items-center rounded-full text-faint outline-none hover:text-muted focus-visible:text-primary"
            >
              <Info size={13} aria-hidden="true" />
              <span
                role="tooltip"
                className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-20 w-max max-w-60 -translate-x-1/2 rounded-md bg-fg px-2 py-1 text-xs leading-snug font-normal text-bg opacity-0 shadow transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
              >
                {tip}
              </span>
            </span>
          )}
        </span>
        {labelAside}
      </div>
      {children}
      {hint ? (
        <span
          id={error ? `${htmlFor}-error` : undefined}
          className={error ? 'text-xs text-danger' : 'text-xs text-faint'}
        >
          {error ? t(error) : hint}
        </span>
      ) : (
        error && (
          <span
            id={`${htmlFor}-error`}
            className="absolute top-full left-0 mt-0.5 max-w-full truncate text-xs leading-[14px] text-danger"
          >
            {t(error)}
          </span>
        )
      )}
    </div>
  )
}
