import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { isClientError } from '@/shared/api/errors'
import { useTableFilters } from '@/shared/hooks/useTableFilters'
import { useTableParams } from '@/shared/hooks/useTableParams'
import { formatDate, formatNumber } from '@/shared/lib/format'
import {
  Button,
  Chip,
  ConfirmDialog,
  DataTable,
  Highlight,
  ListLayout,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  TableCard,
  TableToolbar,
  type Column,
} from '@/shared/ui'
import { priceRequestApi, priceRequestKeys } from './api'
import { RejectDialog } from './RejectDialog'
import type { PriceRequest, RequestStatus } from './types'

const KEY = 'priceRequests'
const FILTERS = { status: 'string' } as const
const STATUSES: RequestStatus[] = ['PENDING', 'APPROVED', 'REJECTED']
const STATUS_TONE = { PENDING: 'warn', APPROVED: 'ok', REJECTED: 'danger' } as const

/** How a request is named in messages: its product, else its article, else its number. */
const requestName = (r: PriceRequest) => r.productName || r.productArticle || `#${r.id}`

const money = (value: number | null | undefined, symbol: string | null | undefined) =>
  value == null ? '—' : `${formatNumber(value)} ${symbol ?? ''}`.trim()

/** Approve or reject: one request (from its row) or the selected pending ones. */
type Action =
  { kind: 'approve'; rows: PriceRequest[] } | { kind: 'reject'; rows: PriceRequest[] } | null

/**
 * Suppliers' requests to change a price (the old layout/priceRequest/PriceRequestList.jsx).
 * Pending ones can be approved or rejected with a reason, one by one or several at once.
 */
export function PriceRequestListPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  // Page, size and search in the URL like every table; the status as a filter.
  const [params, setParams] = useTableParams(KEY, 10)
  const { filters, setFilters } = useTableFilters(KEY, FILTERS)
  const status = (filters.status as RequestStatus | null) ?? null
  const search = params.search ?? ''

  const list = useQuery({
    queryKey: [...priceRequestKeys.all, params.page, params.size, status, search],
    queryFn: ({ signal }) =>
      priceRequestApi.list({ page: params.page - 1, size: params.size, status, search }, signal),
    placeholderData: keepPreviousData,
  })
  const rows = list.data?.data ?? []
  const pending = rows.filter((r) => r.requestStatus === 'PENDING')

  // Only pending requests of the page shown can be chosen. Another page, size, status or search
  // starts with nothing chosen, as the old page did.
  const view = `${params.page}|${params.size}|${status}|${search}`
  const [chosenIn, setChosenIn] = useState(view)
  const [chosen, setChosen] = useState<ReadonlySet<number>>(new Set())
  if (chosenIn !== view) {
    setChosenIn(view)
    setChosen(new Set())
  }
  const selected = pending.filter((r) => chosen.has(r.id))
  const allSelected = pending.length > 0 && selected.length === pending.length
  const toggle = (id: number) =>
    setChosen((prev) => {
      const next = new Set(prev)
      if (!next.delete(id)) next.add(id)
      return next
    })

  const [action, setAction] = useState<Action>(null)
  const [running, setRunning] = useState(false)

  /**
   * One request after another, as the old page did. Returns how many went through and the first
   * 4xx message: the API client toasts only 5xx, network errors and 420 itself.
   */
  const run = async (rows: PriceRequest[], call: (row: PriceRequest) => Promise<unknown>) => {
    let done = 0
    let clientError: string | undefined
    for (const row of rows) {
      try {
        await call(row)
        done++
      } catch (e) {
        if (isClientError(e) && e.status !== 420) clientError ??= e.message
      }
    }
    setChosen(new Set())
    await queryClient.invalidateQueries({ queryKey: priceRequestKeys.all })
    return { done, clientError }
  }

  /** All went through — success; several, some failed — «done N of M»; one failed — its error. */
  const report = (
    { done, clientError }: { done: number; clientError?: string },
    total: number,
    one: string,
    many: string,
  ) => {
    if (done === total) toast.success(t(total > 1 ? many : one))
    else if (total > 1) toast.warning(t('priceRequests.partly', { done, total }))
    else if (clientError) toast.error(clientError)
  }

  const approve = async (rows: PriceRequest[]) => {
    setRunning(true)
    const result = await run(rows, (r) => priceRequestApi.approve(r.id))
    setRunning(false)
    setAction(null)
    report(
      result,
      rows.length,
      'priceRequests.approve_success',
      'priceRequests.approve_all_success',
    )
  }

  const reject = async (rows: PriceRequest[], reason: string) => {
    const result = await run(rows, (r) => priceRequestApi.reject(r.id, reason))
    report(result, rows.length, 'priceRequests.reject_success', 'priceRequests.reject_all_success')
    // A single rejection that failed keeps the dialog (and the typed reason) open, as the old page.
    if (rows.length === 1 && result.done === 0) throw new Error('not rejected')
  }

  const columns: Column<PriceRequest>[] = [
    {
      key: 'select',
      className: 'w-10',
      title: (
        <input
          type="checkbox"
          className="size-4 accent-primary"
          aria-label={t('priceRequests.select_all')}
          disabled={pending.length === 0}
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = selected.length > 0 && !allSelected
          }}
          onChange={() => setChosen(allSelected ? new Set() : new Set(pending.map((r) => r.id)))}
        />
      ),
      render: (row) =>
        row.requestStatus === 'PENDING' && (
          <input
            type="checkbox"
            className="size-4 accent-primary"
            aria-label={t('priceRequests.select', { name: requestName(row) })}
            checked={chosen.has(row.id)}
            onChange={() => toggle(row.id)}
          />
        ),
    },
    {
      key: 'number',
      title: '№',
      className: 'w-12 tabular-nums text-faint',
      render: (_, i) => (params.page - 1) * params.size + i + 1,
    },
    {
      key: 'product',
      title: t('priceRequests.product'),
      render: (row) => (
        <span className="grid">
          <span className="font-medium">
            <Highlight text={row.productName || '—'} query={search} />
          </span>
          {row.productArticle && (
            <span className="text-xs text-faint">
              <Highlight text={row.productArticle} query={search} />
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'supplierName',
      title: t('priceRequests.supplier'),
      render: (row) => <Highlight text={row.supplierName || '—'} query={search} />,
    },
    {
      key: 'texture',
      title: t('priceRequests.texture'),
      render: (row) => (
        <span className="inline-flex items-center gap-2">
          {row.textureColor && (
            <span
              aria-hidden="true"
              className="size-4 shrink-0 rounded border border-line-strong"
              style={{ backgroundColor: row.textureColor }}
            />
          )}
          {row.textureName || '—'}
        </span>
      ),
    },
    {
      key: 'currentPrice',
      title: t('priceRequests.current_price'),
      align: 'right',
      render: (row) => (
        <span className="tabular-nums">{money(row.currentPrice, row.currencySymbol)}</span>
      ),
    },
    {
      key: 'requestedPrice',
      title: t('priceRequests.requested_price'),
      align: 'right',
      render: (row) => <RequestedPrice row={row} />,
    },
    {
      key: 'createdDate',
      title: t('priceRequests.created_at'),
      render: (row) => <span className="tabular-nums">{formatDate(row.createdDate) || '—'}</span>,
    },
    {
      key: 'status',
      title: t('priceRequests.status_label'),
      render: (row) => (
        <Chip tone={STATUS_TONE[row.requestStatus] ?? 'default'}>
          {t(`priceRequests.status.${row.requestStatus.toLowerCase()}`)}
        </Chip>
      ),
    },
  ]

  return (
    <ListLayout>
      <PageHeader
        title={t('priceRequests.title')}
        actions={
          selected.length > 0 && (
            <>
              <span className="self-center text-muted">
                {t('priceRequests.selected_count', { count: selected.length })}
              </span>
              <Button
                icon={<Check size={16} />}
                onClick={() => setAction({ kind: 'approve', rows: selected })}
              >
                {t('priceRequests.approve_all')}
              </Button>
              <Button
                variant="danger"
                icon={<X size={16} />}
                onClick={() => setAction({ kind: 'reject', rows: selected })}
              >
                {t('priceRequests.reject_all')}
              </Button>
            </>
          )
        }
      />

      <TableCard>
        <TableToolbar>
          <SearchInput
            value={search}
            onChange={(q) => setParams({ search: q, page: 1 })}
            placeholder={t('priceRequests.search_placeholder')}
            minLength={1}
            className="w-full sm:w-72"
          />
          <Select
            aria-label={t('priceRequests.status_label')}
            value={status ?? ''}
            onChange={(e) => setFilters({ status: e.target.value || null })}
            className="w-full sm:w-48"
          >
            <option value="">{t('priceRequests.all_statuses')}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`priceRequests.status.${s.toLowerCase()}`)}
              </option>
            ))}
          </Select>
        </TableToolbar>

        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.id}
          loading={list.isPending}
          fetching={list.isFetching}
          error={list.error}
          onRetry={() => list.refetch()}
          empty={t('priceRequests.empty')}
          actions={(row) =>
            row.requestStatus === 'PENDING' && (
              <div className="flex gap-1.5">
                <Button size="sm" onClick={() => setAction({ kind: 'approve', rows: [row] })}>
                  {t('priceRequests.approve')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAction({ kind: 'reject', rows: [row] })}
                >
                  {t('priceRequests.reject')}
                </Button>
              </div>
            )
          }
        />
        <Pagination
          page={params.page}
          size={params.size}
          total={list.data?.total ?? 0}
          onChange={(next) => setParams(next)}
        />
      </TableCard>

      <ConfirmDialog
        open={action?.kind === 'approve'}
        tone="primary"
        title={t(
          action && action.rows.length > 1
            ? 'priceRequests.approve_all_confirm_title'
            : 'priceRequests.approve_confirm_title',
        )}
        description={
          action && action.rows.length > 1
            ? t('priceRequests.approve_all_confirm_text', { count: action.rows.length })
            : t('priceRequests.approve_confirm_text', {
                name: action?.rows[0] ? requestName(action.rows[0]) : '',
                price: money(action?.rows[0]?.requestedPrice, action?.rows[0]?.currencySymbol),
              })
        }
        confirmLabel={t('priceRequests.approve')}
        loading={running}
        onConfirm={() => action && approve(action.rows)}
        onCancel={() => !running && setAction(null)}
      />
      {action?.kind === 'reject' && (
        <RejectDialog
          count={action.rows.length}
          onReject={(reason) => reject(action.rows, reason)}
          onClose={() => setAction(null)}
        />
      )}
    </ListLayout>
  )
}

/** The requested price with how much it changes the current one: ▲ dearer, ▼ cheaper. */
function RequestedPrice({ row }: { row: PriceRequest }) {
  const { t } = useTranslation()
  if (row.requestedPrice == null) return <>—</>
  const pct =
    row.currentPrice != null && row.currentPrice !== 0
      ? ((row.requestedPrice - row.currentPrice) / row.currentPrice) * 100
      : null
  const change = pct === null ? '' : `${pct > 0 ? '▲' : '▼'}${formatNumber(Math.abs(pct), 1)}%`
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-medium tabular-nums text-primary-strong">
        {money(row.requestedPrice, row.currencySymbol)}
      </span>
      {pct !== null && (
        <Chip tone={pct > 0 ? 'danger' : 'ok'} title={t('priceRequests.change', { value: change })}>
          {change}
        </Chip>
      )}
    </span>
  )
}
