import type { ReactNode } from 'react'
import { CircleCheck, Info, TriangleAlert } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

const TONES = {
  danger: { className: 'bg-danger-soft text-danger', Icon: TriangleAlert },
  warn: { className: 'bg-warn-soft text-warn', Icon: Info },
  ok: { className: 'bg-ok-soft text-ok', Icon: CircleCheck },
}

export function Alert({
  tone = 'danger',
  children,
}: {
  tone?: keyof typeof TONES
  children: ReactNode
}) {
  const { className, Icon } = TONES[tone]
  return (
    <div
      role="alert"
      className={cn('flex items-start gap-2.5 rounded-md px-3 py-2.5 text-[13px]', className)}
    >
      <Icon size={18} className="mt-px shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  )
}
