import { useEffect, useId, useRef, type FormEventHandler, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { IconButton } from './IconButton'

const SIZES = {
  sm: 'max-w-[400px]',
  md: 'max-w-[520px]',
  lg: 'max-w-[720px]',
  /** A work area (two lists side by side): wide and tall. */
  xl: 'max-w-[1120px] h-[min(760px,calc(100%-32px))]',
  /** The whole window, e.g. a work area maximized. */
  full: 'max-w-none h-[calc(100%-32px)]',
}

type ModalProps = {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: keyof typeof SIZES
  /** Wraps body and footer in a <form>, so Enter submits and footer buttons can be type="submit". */
  onSubmit?: FormEventHandler<HTMLFormElement>
  /**
   * A click on the dark backdrop closes it too. Off by default: a stray click mustn't lose what's
   * typed. Escape and the × always close.
   */
  closeOnBackdrop?: boolean
  /** Lines under the title (outside its heading, so the dialog's name stays short). */
  description?: ReactNode
  /** Buttons beside the × (e.g. maximize). */
  headerActions?: ReactNode
  /**
   * The body's own layout instead of the padded column — a work area that fills the dialog
   * (`flex min-h-0 flex-1 flex-col`) and scrolls its parts itself.
   */
  bodyClassName?: string
}

/**
 * Native <dialog>: the browser handles focus trapping, Escape and the top layer.
 * Closes on Escape and the × button; on a click on the backdrop only with `closeOnBackdrop`.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  onSubmit,
  closeOnBackdrop = false,
  headerActions,
  bodyClassName,
  description,
}: ModalProps) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const body = (
    <>
      <div className={bodyClassName ?? 'grid gap-4 px-4 py-5'}>{children}</div>
      {footer && (
        <div className="flex shrink-0 flex-wrap justify-end gap-2 rounded-b-lg border-t border-line bg-surface-2 px-4 py-3.5">
          {footer}
        </div>
      )}
    </>
  )

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // Escape: keep the dialog in React's hands instead of letting the browser close it.
      onCancel={(e) => {
        // «cancel» also bubbles up from a file input whose picker was closed without a choice —
        // only the dialog's own cancel (Escape) closes it.
        if (e.target !== e.currentTarget) return
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => closeOnBackdrop && e.target === e.currentTarget && onClose()}
      className={cn(
        'm-auto max-h-[calc(100%-32px)] w-[calc(100%-32px)] rounded-lg border border-line bg-surface p-0 text-fg',
        // a work area lays out in a column and scrolls its parts; a plain dialog scrolls whole
        // (open: only — a closed <dialog> must stay display: none)
        bodyClassName ? 'overflow-hidden open:flex open:flex-col' : 'overflow-auto',
        'shadow-[0_1px_2px_rgb(19_38_42/.06),0_8px_24px_rgb(19_38_42/.08)] backdrop:bg-overlay',
        SIZES[size],
      )}
    >
      {open && (
        <>
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-2">
            <div className="grid min-w-0 gap-0.5">
              <h3 id={titleId} className="min-w-0 truncate text-base font-semibold">
                {title}
              </h3>
              {description && <div className="text-xs text-muted">{description}</div>}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {headerActions}
              <IconButton label={t('common.close')} onClick={onClose}>
                <X size={18} />
              </IconButton>
            </div>
          </div>
          {onSubmit ? (
            <form
              noValidate
              onSubmit={onSubmit}
              className={bodyClassName ? 'flex min-h-0 flex-1 flex-col' : undefined}
            >
              {body}
            </form>
          ) : (
            body
          )}
        </>
      )}
    </dialog>
  )
}
