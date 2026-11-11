import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/cn'
import { Alert, Spinner } from '@/shared/ui'
import type { Webcc } from './useWebcc'

/** Where the constructor draws (the old <div id="webcc"> on a grid). */
export function WebccCanvas({ webcc, className }: { webcc: Webcc; className?: string }) {
  const { t } = useTranslation()
  const { attach } = webcc
  if (webcc.status === 'no-token') return <Alert tone="warn">{t('webcc.no_token')}</Alert>
  return (
    <div
      className={cn(
        'relative min-h-[420px] overflow-hidden rounded-md border border-line',
        className,
      )}
    >
      {/* the runtime takes this element's size when it starts */}
      <div
        id={webcc.containerId}
        ref={attach}
        className="absolute inset-0 bg-surface-2 bg-[linear-gradient(var(--line)_1px,transparent_1px),linear-gradient(90deg,var(--line)_1px,transparent_1px)] bg-[length:20px_20px]"
      />
      {webcc.status === 'loading' && (
        <div className="absolute inset-0 grid place-items-center text-primary">
          <Spinner className="size-6" />
        </div>
      )}
      {webcc.status === 'error' && (
        <div className="absolute inset-x-3 top-3">
          <Alert>{t('webcc.load_error')}</Alert>
        </div>
      )}
    </div>
  )
}
