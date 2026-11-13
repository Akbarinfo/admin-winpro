import { useTranslation } from 'react-i18next'
import { formatDateTime, formatNumber } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'
import type { AkfaSummary as Summary } from './types'

/** «Consumer работает» and the last message's time, in the page header. */
export function ListenerState({ summary }: { summary?: Summary }) {
  const { t } = useTranslation()
  if (!summary) return null
  const running = !!summary.listenerRunning
  return (
    <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
      <span
        aria-hidden="true"
        className={cn('size-2.5 rounded-full', running ? 'bg-ok' : 'bg-danger')}
      />
      {t(running ? 'akfa.header.listener_running' : 'akfa.header.listener_stopped')}
      {summary.lastMessageAt && (
        <span className="text-faint">
          · {t('akfa.last_message_at', { at: formatDateTime(summary.lastMessageAt) })}
        </span>
      )}
    </p>
  )
}

type Counts = Record<string, unknown>

const CARDS = [
  { key: 'newProductsCount', label: 'akfa.summary.new_products', tone: 'text-primary-strong' },
  { key: 'unmappedCount', label: 'akfa.summary.needs_mapping', tone: 'text-muted' },
  { key: 'pendingPriceCount', label: 'akfa.summary.pending_price_changes', tone: 'text-warn' },
  { key: 'needsReviewCount', label: 'akfa.summary.needs_review', tone: 'text-fg' },
  { key: 'mappedCount', label: 'akfa.summary.mapped', tone: 'text-ok' },
  { key: 'ignoredCount', label: 'akfa.summary.ignored', tone: 'text-faint' },
  { key: 'priceErrorCount', label: 'akfa.summary.price_errors', tone: 'text-danger' },
  { key: 'unsupportedPriceCount', label: 'akfa.summary.unsupported_price', tone: 'text-muted' },
]

/** The counts, for information only (not clickable, as before). */
export function SummaryCards({ counts }: { counts?: Counts }) {
  const { t } = useTranslation()
  if (!counts) return null
  return (
    <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-8">
      {CARDS.map((card) => (
        <div
          key={card.key}
          className="flex min-w-0 flex-col-reverse justify-end gap-1 rounded-lg border border-line bg-surface px-4 py-3"
        >
          <dt className="text-xs leading-snug text-muted">{t(card.label)}</dt>
          <dd className={cn('text-2xl font-semibold leading-tight tabular-nums', card.tone)}>
            {typeof counts[card.key] === 'number' ? formatNumber(counts[card.key] as number) : '—'}
          </dd>
        </div>
      ))}
    </dl>
  )
}
