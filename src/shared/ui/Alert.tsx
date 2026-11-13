import type { ReactNode } from 'react'
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

// As in my-winpro: a soft ground with a -200 line and dark text; each tone its own icon,
// so the kind of message isn't told by colour alone.
const TONES = {
  danger: { className: 'border-danger-line bg-danger-soft text-danger', Icon: TriangleAlert },
  warn: { className: 'border-warn-line bg-warn-soft text-warn', Icon: CircleAlert },
  info: { className: 'border-info-line bg-info-soft text-info', Icon: Info },
  ok: { className: 'border-ok-line bg-ok-soft text-ok', Icon: CircleCheck },
}

export function Alert({
  tone = 'danger',
  title,
  children,
}: {
  tone?: keyof typeof TONES
  /** A bold first line (e.g. «Заказ возвращён»), the text under it. */
  title?: ReactNode
  children: ReactNode
}) {
  const { className, Icon } = TONES[tone]
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-[13px] font-medium',
        className,
      )}
    >
      <Icon size={18} className="mt-px shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        <div className={cn(title && 'font-normal')}>{children}</div>
      </div>
    </div>
  )
}
