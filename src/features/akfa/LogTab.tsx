import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { RefreshCw, Scale } from 'lucide-react'
import { toast } from 'sonner'
import { useConfirm } from '@/shared/hooks/useConfirm'
import { useTableFilters } from '@/shared/hooks/useTableFilters'
import { useTableParams } from '@/shared/hooks/useTableParams'
import { formatDateTime } from '@/shared/lib/format'
import {
  Alert,
  Button,
  Chip,
  DataTable,
  Modal,
  Pagination,
  Select,
  Spinner,
  TableCard,
  TableToolbar,
  type Column,
} from '@/shared/ui'
import { AKFA_PAGE_SIZE, akfaApi, akfaKeys } from './api'
import { toastClientError } from './helpers'
import type { AkfaMessage } from './types'

const KEY = 'log'
const FILTERS = { status: 'string', type: 'string' } as const
const STATUSES = ['PROCESSED', 'PARTIAL', 'FAILED']
const TYPES = ['PRODUCT', 'PRODUCT_LIST', 'PRODUCT_RATE']
/** These can be processed again. */
const RETRYABLE = ['FAILED', 'PARTIAL']
const STATUS_TONES: Record<string, 'ok' | 'warn' | 'danger'> = {
  PROCESSED: 'ok',
  PARTIAL: 'warn',
  FAILED: 'danger',
}

/** The message as indented JSON when it is JSON (the old prettyBody). */
const pretty = (body: unknown) => {
  if (body === null || body === undefined) return '—'
  if (typeof body !== 'string') return JSON.stringify(body, null, 2)
  try {
    return JSON.stringify(JSON.parse(body), null, 2)
  } catch {
    return body
  }
}

/** «Журнал»: messages from Akfa's queue, a failed one processed again, prices recalculated (the old AkfaLogSettingsTab). */
export function LogTab() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const confirm = useConfirm()
  const [params, setParams] = useTableParams(KEY, AKFA_PAGE_SIZE)
  const { filters, setFilters } = useTableFilters(KEY, FILTERS)

  const list = useQuery({
    queryKey: [...akfaKeys.messages, params.page, params.size, filters.status, filters.type],
    queryFn: ({ signal }) =>
      akfaApi.messages(
        { status: filters.status, type: filters.type, page: params.page, size: params.size },
        signal,
      ),
    placeholderData: keepPreviousData,
  })

  const retry = useMutation({
    mutationFn: (m: AkfaMessage) => akfaApi.retryMessage(m.id),
    onSuccess: () => {
      toast.success(t('akfa.logSettings.retry_success'))
      void queryClient.invalidateQueries({ queryKey: akfaKeys.all })
    },
    onError: (e) => toastClientError(e, t('akfa.common.action_error')),
  })

  const recalculate = useMutation({
    mutationFn: akfaApi.recalculateRates,
    onSuccess: () => toast.success(t('akfa.logSettings.recalculate_started')),
    onError: (e) => toastClientError(e, t('akfa.common.action_error')),
  })
  const askRecalculate = async () => {
    const ok = await confirm.ask({
      title: t('akfa.logSettings.recalculate_confirm_title'),
      description: t('akfa.logSettings.recalculate_confirm_text'),
      confirmLabel: t('akfa.logSettings.recalculate_button'),
    })
    if (ok) recalculate.mutate()
  }

  const [opened, setOpened] = useState<AkfaMessage | null>(null)

  const columns: Column<AkfaMessage>[] = [
    {
      key: 'receivedAt',
      title: t('akfa.logSettings.col_received'),
      render: (m) => formatDateTime(m.receivedAt) || '—',
    },
    { key: 'messageType', title: t('akfa.logSettings.col_type') },
    {
      key: 'queue',
      title: t('akfa.logSettings.col_queue'),
      className: 'max-w-[260px] whitespace-normal break-all text-xs text-muted',
    },
    {
      key: 'itemCount',
      title: t('akfa.logSettings.col_items'),
      className: 'tabular-nums',
      render: (m) => (
        <>
          {m.itemCount ?? '—'}
          {!!m.failedCount && <span className="text-danger"> / {m.failedCount} ✕</span>}
        </>
      ),
    },
    {
      key: 'status',
      title: t('akfa.common.status_label'),
      className: 'whitespace-normal',
      render: (m) => (
        <div className="grid justify-items-start gap-1">
          <span className="flex items-center gap-1">
            <Chip tone={STATUS_TONES[m.status ?? ''] ?? 'default'}>{m.status}</Chip>
            {(m.attempts ?? 0) > 1 && <span className="text-xs text-faint">×{m.attempts}</span>}
          </span>
          {m.error && <span className="max-w-[320px] text-xs text-danger">{m.error}</span>}
        </div>
      ),
    },
    {
      key: 'processedAt',
      title: t('akfa.logSettings.col_processed'),
      render: (m) => formatDateTime(m.processedAt) || '—',
    },
  ]

  return (
    <TableCard>
      <TableToolbar>
        <Select
          aria-label={t('akfa.message_status')}
          className="w-auto"
          value={filters.status ?? ''}
          onChange={(e) => setFilters({ status: e.target.value || null })}
        >
          <option value="">{t('akfa.logSettings.filter_status_all')}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select
          aria-label={t('akfa.message_type')}
          className="w-auto"
          value={filters.type ?? ''}
          onChange={(e) => setFilters({ type: e.target.value || null })}
        >
          <option value="">{t('akfa.logSettings.filter_type_all')}</option>
          {TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </Select>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <Link
            to="/integrations/unit"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-line-strong bg-surface px-3.5 font-medium hover:border-primary hover:text-primary"
          >
            <Scale size={16} aria-hidden="true" />
            {t('akfa.units.title')}
          </Link>
          <Button
            icon={<RefreshCw size={16} />}
            loading={recalculate.isPending}
            onClick={askRecalculate}
          >
            {t('akfa.logSettings.recalculate_button')}
          </Button>
        </div>
      </TableToolbar>

      <DataTable
        columns={columns}
        rows={list.data?.data ?? []}
        getRowKey={(m) => m.id}
        loading={list.isPending}
        fetching={list.isFetching}
        error={list.error}
        onRetry={() => list.refetch()}
        empty={t('akfa.logSettings.empty')}
        actions={(m) => (
          <>
            <Button size="sm" variant="outline" onClick={() => setOpened(m)}>
              {t('akfa.logSettings.detail_button')}
            </Button>
            {RETRYABLE.includes(m.status ?? '') && (
              <Button
                size="sm"
                loading={retry.isPending && retry.variables?.id === m.id}
                disabled={retry.isPending}
                onClick={() => retry.mutate(m)}
              >
                {t('akfa.logSettings.retry_button')}
              </Button>
            )}
          </>
        )}
      />
      <Pagination
        page={params.page}
        size={params.size}
        total={list.data?.total ?? 0}
        onChange={(next) => setParams(next)}
      />

      {opened && <MessageDialog message={opened} onClose={() => setOpened(null)} />}
      {confirm.dialog}
    </TableCard>
  )
}

/** A message in full: its error and body (GET /messages/{id}). */
function MessageDialog({ message, onClose }: { message: AkfaMessage; onClose: () => void }) {
  const { t } = useTranslation()
  const detail = useQuery({
    queryKey: [...akfaKeys.messages, 'detail', message.id],
    queryFn: ({ signal }) => akfaApi.message(message.id, signal),
  })
  // until (or unless) it loads, what the row had
  const shown = detail.data ?? message
  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      title={`#${shown.id} · ${shown.messageType ?? ''}`}
      footer={
        <Button variant="outline" onClick={onClose}>
          {t('common.close')}
        </Button>
      }
    >
      {shown.error && <Alert>{shown.error}</Alert>}
      {detail.isPending ? (
        <div className="grid place-items-center py-8 text-primary">
          <Spinner className="size-6" />
        </div>
      ) : (
        <>
          {detail.isError && <Alert tone="warn">{t('akfa.common.load_error')}</Alert>}
          <pre className="max-h-[60vh] overflow-auto rounded-md border border-line bg-surface-2 p-3 text-xs whitespace-pre">
            {pretty(shown.body)}
          </pre>
        </>
      )}
    </Modal>
  )
}
