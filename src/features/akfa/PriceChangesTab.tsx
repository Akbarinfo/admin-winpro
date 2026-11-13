import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react'
import { toast } from 'sonner'
import { ApiError } from '@/shared/api/errors'
import { useConfirm } from '@/shared/hooks/useConfirm'
import { useRowSelection } from '@/shared/hooks/useRowSelection'
import { useTableFilters } from '@/shared/hooks/useTableFilters'
import { useTableParams } from '@/shared/hooks/useTableParams'
import { formatDateTime, formatNumber } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'
import {
  Button,
  Chip,
  DataTable,
  Highlight,
  Pagination,
  SearchInput,
  Select,
  TableCard,
  TableToolbar,
  type Column,
} from '@/shared/ui'
import { AKFA_PAGE_SIZE, akfaApi, akfaKeys } from './api'
import { formatPrice, toastClientError } from './helpers'
import type { AkfaMapping, BulkResult } from './types'

const KEY = 'prices'
const FILTERS = { status: 'string', minDelta: 'number' } as const
const PRICE_STATUSES = ['PENDING', 'ERROR', 'SYNCED', 'REJECTED', 'NO_PRICE', 'UNSUPPORTED']
const MIN_DELTAS = [5, 10, 20]
/** A change this big (%) gets a warning sign, as before. */
const BIG_DELTA = 15

const STATUS_TONES: Record<string, 'primary' | 'ok' | 'default' | 'danger' | 'warn'> = {
  PENDING: 'primary',
  SYNCED: 'ok',
  REJECTED: 'default',
  ERROR: 'danger',
  NO_PRICE: 'warn',
  UNSUPPORTED: 'default',
}

/** «▲12,5%»: a rise in red, a fall in green; a big one gets ⚠. */
function Delta({ value }: { value?: number | null }) {
  const { t } = useTranslation()
  if (value === null || value === undefined) return <span className="text-faint">—</span>
  const up = value > 0
  const big = Math.abs(value) >= BIG_DELTA
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums',
        up ? 'bg-danger-soft text-danger' : 'bg-ok-soft text-ok',
      )}
    >
      {big && <AlertTriangle size={12} role="img" aria-label={t('akfa.big_delta')} />}
      {up ? <ArrowUp size={12} aria-hidden="true" /> : <ArrowDown size={12} aria-hidden="true" />}
      {formatNumber(Math.abs(value), 1)}%
    </span>
  )
}

/**
 * «Изменения цен»: new Akfa rates waiting to become WinPro prices (the old AkfaPriceChangesTab).
 * Approve or reject one or the chosen pending ones. A price changed some other way meanwhile
 * (stale) is approved only after asking again, with `force`.
 */
export function PriceChangesTab() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const confirm = useConfirm()
  const [params, setParams] = useTableParams(KEY, AKFA_PAGE_SIZE)
  const { filters, setFilters } = useTableFilters(KEY, FILTERS)
  // as the old tab: pending ones first, there is no «all»
  const status = filters.status ?? 'PENDING'
  const search = params.search ?? ''

  const list = useQuery({
    queryKey: [
      ...akfaKeys.mappings,
      'prices',
      params.page,
      params.size,
      status,
      filters.minDelta,
      search,
    ],
    queryFn: ({ signal }) =>
      akfaApi.mappings(
        {
          priceStatus: status,
          minDelta: filters.minDelta,
          search,
          page: params.page,
          size: params.size,
        },
        signal,
      ),
    placeholderData: keepPreviousData,
  })
  const rows = list.data?.data ?? []
  const selection = useRowSelection(
    rows,
    `${params.page}|${params.size}|${status}|${filters.minDelta}|${search}`,
    (r) => r.priceStatus === 'PENDING',
  )
  const { selected, allSelected } = selection

  const [busy, setBusy] = useState(false)
  /** One action at a time; afterwards the lists and the counts refresh, the choice goes. */
  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    try {
      await action()
    } finally {
      setBusy(false)
      selection.clear()
      void queryClient.invalidateQueries({ queryKey: akfaKeys.all })
    }
  }

  const ask = (kind: 'approve' | 'reject', count: number) =>
    confirm.ask({
      title: t(`akfa.priceChanges.${kind}_confirm_title`),
      description: t(`akfa.priceChanges.${kind}_confirm_text`, { count }),
      confirmLabel: t(`akfa.priceChanges.${kind}`),
      tone: kind === 'reject' ? 'danger' : 'primary',
    })
  const askForce = (count: number, reason?: string) =>
    confirm.ask({
      title: t('akfa.priceChanges.stale_confirm_title', { count }),
      description: reason || t('akfa.priceChanges.stale_confirm_text'),
      confirmLabel: t('akfa.priceChanges.approve'),
    })

  /** Processed — one success line; skipped — a warning each (as before). */
  const report = (result: BulkResult | undefined, successKey: string) => {
    const done = result?.processed ?? []
    if (done.length > 0) toast.success(t(successKey, { count: done.length }))
    for (const s of result?.skipped ?? []) toast.warning(`#${s.id}: ${s.reason}`)
  }

  const approveOne = async (row: AkfaMapping) => {
    if (!(await ask('approve', 1))) return
    await run(async () => {
      try {
        try {
          await akfaApi.approvePrice(row.id)
        } catch (e) {
          // stale: the server says why (409); approve anyway only if asked to
          if (!(e instanceof ApiError && e.status === 409)) throw e
          // the server's reason, or the usual text when its answer had none (as before)
          if (!(await askForce(1, e.backendMessage))) return
          await akfaApi.approvePrice(row.id, true)
        }
        toast.success(t('akfa.priceChanges.approve_success', { count: 1 }))
      } catch (e) {
        toastClientError(e, t('akfa.common.action_error'))
      }
    })
  }

  const approveChosen = async () => {
    const ids = selected.map((r) => r.id)
    if (!(await ask('approve', ids.length))) return
    await run(async () => {
      try {
        const result = await akfaApi.bulkApprovePrice(ids)
        // the stale ones are skipped: asked about together, the others reported now
        const staleIds = new Set(rows.filter((r) => r.stale).map((r) => r.id))
        const skipped = result?.skipped ?? []
        const stale = skipped.filter((s) => staleIds.has(s.id))
        report(
          { processed: result?.processed, skipped: skipped.filter((s) => !staleIds.has(s.id)) },
          'akfa.priceChanges.approve_success',
        )
        if (stale.length > 0 && (await askForce(stale.length)))
          report(
            await akfaApi.bulkApprovePrice(
              stale.map((s) => s.id),
              true,
            ),
            'akfa.priceChanges.approve_success',
          )
      } catch (e) {
        toastClientError(e, t('akfa.common.action_error'))
      }
    })
  }

  const reject = async (ids: number[]) => {
    if (!(await ask('reject', ids.length))) return
    await run(async () => {
      try {
        if (ids.length === 1) {
          await akfaApi.rejectPrice(ids[0])
          toast.success(t('akfa.priceChanges.reject_success', { count: 1 }))
        } else report(await akfaApi.bulkRejectPrice(ids), 'akfa.priceChanges.reject_success')
      } catch (e) {
        toastClientError(e, t('akfa.common.action_error'))
      }
    })
  }

  const columns: Column<AkfaMapping>[] = [
    {
      key: 'select',
      className: 'w-10',
      title: (
        <input
          type="checkbox"
          className="size-4 accent-primary"
          aria-label={t('akfa.select_all')}
          disabled={selection.none}
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = selection.someSelected
          }}
          onChange={selection.toggleAll}
        />
      ),
      render: (row) =>
        row.priceStatus === 'PENDING' && (
          <input
            type="checkbox"
            className="size-4 accent-primary"
            aria-label={t('akfa.select', {
              name: [row.productName, row.textureName].filter(Boolean).join(' · '),
            })}
            checked={selection.isChosen(row.id)}
            onChange={() => selection.toggle(row.id)}
          />
        ),
    },
    {
      key: 'product',
      title: t('akfa.priceChanges.col_product'),
      render: (row) => (
        <div className="grid gap-0.5">
          <span className="font-medium">
            <Highlight text={row.productName ?? ''} query={search} />
            {row.article && <span className="font-normal text-faint"> ({row.article})</span>}
          </span>
          <span className="text-xs text-muted">{row.textureName}</span>
          {row.stale && (
            <span className="flex items-center gap-1 text-xs text-warn">
              <AlertTriangle size={12} aria-hidden="true" />
              {t('akfa.priceChanges.stale_badge')}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'akfaProductName',
      title: t('akfa.priceChanges.col_external'),
      className: 'whitespace-normal min-w-48',
      render: (row) => <Highlight text={row.akfaProductName ?? ''} query={search} />,
    },
    {
      key: 'groupName',
      title: t('akfa.priceChanges.col_group'),
      render: (row) => <Chip>{row.groupName || '—'}</Chip>,
    },
    {
      key: 'pendingBasePrice',
      title: t('akfa.priceChanges.col_current_price'),
      align: 'right',
      className: 'tabular-nums',
      render: (row) => formatPrice(row.pendingBasePrice, row.pendingBaseCurrencySymbol),
    },
    {
      key: 'pendingPrice',
      title: t('akfa.priceChanges.col_new_price'),
      align: 'right',
      className: 'tabular-nums font-medium text-primary-strong',
      render: (row) => formatPrice(row.pendingPrice, row.pendingCurrencySymbol),
    },
    {
      key: 'priceDeltaPercent',
      title: 'Δ',
      render: (row) => <Delta value={row.priceDeltaPercent} />,
    },
    {
      key: 'priceStatus',
      title: t('akfa.common.status_label'),
      render: (row) => (
        <div className="grid justify-items-start gap-1">
          <Chip tone={STATUS_TONES[row.priceStatus ?? ''] ?? 'default'}>
            {t(`akfa.priceStatus.${row.priceStatus}`, { defaultValue: row.priceStatus ?? '' })}
          </Chip>
          {row.priceError && <span className="text-xs text-danger">{row.priceError}</span>}
          {row.lastAppliedAt && (
            <span className="text-xs text-faint">
              {formatPrice(row.lastAppliedPrice, row.pendingCurrencySymbol)} ·{' '}
              {formatDateTime(row.lastAppliedAt)}
              {row.lastAppliedBy ? ` · ${row.lastAppliedBy}` : ''}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'pendingSince',
      title: t('akfa.priceChanges.col_since'),
      render: (row) => formatDateTime(row.pendingSince) || '—',
    },
  ]

  return (
    <TableCard>
      <TableToolbar>
        <Select
          aria-label={t('akfa.common.status_label')}
          className="w-auto"
          value={status}
          onChange={(e) =>
            setFilters({ status: e.target.value === 'PENDING' ? null : e.target.value })
          }
        >
          {PRICE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`akfa.priceStatus.${s}`)}
            </option>
          ))}
        </Select>
        <Select
          aria-label={t('akfa.delta_filter')}
          className="w-auto"
          value={filters.minDelta ?? ''}
          onChange={(e) => setFilters({ minDelta: e.target.value ? Number(e.target.value) : null })}
        >
          <option value="">{t('akfa.priceChanges.filter_delta_all')}</option>
          {MIN_DELTAS.map((d) => (
            <option key={d} value={d}>
              |Δ| ≥ {d}%
            </option>
          ))}
        </Select>
        <SearchInput
          value={search}
          onChange={(q) => setParams({ search: q, page: 1 })}
          placeholder={t('akfa.common.search_placeholder')}
          minLength={1}
        />
        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <span className="text-sm text-muted">
              {t('akfa.common.selected_count', { count: selected.length })}
            </span>
            <Button disabled={busy} onClick={approveChosen}>
              {t('akfa.priceChanges.approve_selected')}
            </Button>
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => reject(selected.map((r) => r.id))}
            >
              {t('akfa.priceChanges.reject_selected')}
            </Button>
          </div>
        )}
      </TableToolbar>

      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(r) => r.id}
        loading={list.isPending}
        fetching={list.isFetching || busy}
        error={list.error}
        onRetry={() => list.refetch()}
        empty={search ? t('common.nothing_found') : t('akfa.priceChanges.empty')}
        actions={(row) =>
          row.priceStatus === 'PENDING' && (
            <>
              <Button size="sm" disabled={busy} onClick={() => approveOne(row)}>
                {t('akfa.priceChanges.approve')}
              </Button>
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => reject([row.id])}>
                {t('akfa.priceChanges.reject')}
              </Button>
            </>
          )
        }
      />
      <Pagination
        page={params.page}
        size={params.size}
        total={list.data?.total ?? 0}
        onChange={(next) => setParams(next)}
      />
      {confirm.dialog}
    </TableCard>
  )
}
