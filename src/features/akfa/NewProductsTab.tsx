import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { useRowSelection } from '@/shared/hooks/useRowSelection'
import { useTableFilters } from '@/shared/hooks/useTableFilters'
import { useTableParams } from '@/shared/hooks/useTableParams'
import { formatDateTime } from '@/shared/lib/format'
import { saveBlob } from '@/shared/lib/download'
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
import { IgnoreDialog } from './IgnoreDialog'
import { MapProductDialog } from './MapProductDialog'
import type { AkfaProduct, HubPage } from './types'

const KEY = 'new'
const FILTERS = { isNew: 'boolean' } as const

/** «Новые товары»: products a dealer added in Akfa, to map to WinPro or ignore (the old AkfaNewProductsTab). */
export function NewProductsTab() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [params, setParams] = useTableParams(KEY, AKFA_PAGE_SIZE)
  const { filters, setFilters } = useTableFilters(KEY, FILTERS)
  const search = params.search ?? ''

  const listKey = [...akfaKeys.products, 'new', params.page, params.size, filters.isNew, search]
  const list = useQuery({
    queryKey: listKey,
    queryFn: ({ signal }) =>
      akfaApi.products(
        {
          source: 'PRODUCT',
          // only «unseen» is a filter; «all» sends none (as before)
          isNew: filters.isNew || undefined,
          search,
          page: params.page,
          size: params.size,
        },
        signal,
      ),
    placeholderData: keepPreviousData,
  })
  const rows = list.data?.data ?? []
  // After an ignore, a mapping or a new product: the lists and the counts.
  const refresh = () => queryClient.invalidateQueries({ queryKey: akfaKeys.all })

  // Chosen on this page only: another page, filter or search starts with none (as before).
  const selection = useRowSelection(
    rows,
    `${params.page}|${params.size}|${filters.isNew}|${search}`,
  )
  const { selected, allSelected } = selection

  const [ignoring, setIgnoring] = useState<number[] | null>(null)
  /** As the old tab: the dialog closes, the selection goes and the lists refresh, even on an error. */
  const ignore = async (ids: number[], reason: string) => {
    try {
      const result = await akfaApi.ignore(ids, reason)
      const done = result?.ignored ?? []
      if (done.length > 0)
        toast.success(t('akfa.newProducts.ignore_success', { count: done.length }))
      for (const s of result?.skipped ?? []) toast.warning(`#${s.id}: ${s.reason}`)
    } catch (e) {
      toastClientError(e, t('akfa.common.action_error'))
    }
    selection.clear()
    void refresh()
  }

  const [mapping, setMapping] = useState<AkfaProduct | null>(null)
  // Seen: the row loses its «Новый» in place (as before), only the counts are asked again.
  const markSeen = useMutation({
    mutationFn: akfaApi.markSeen,
    onSuccess: (_, id) => {
      queryClient.setQueryData<HubPage<AkfaProduct>>(
        listKey,
        (page) =>
          page && {
            ...page,
            data: page.data.map((r) => (r.id === id ? { ...r, isNew: false } : r)),
          },
      )
      void queryClient.invalidateQueries({ queryKey: akfaKeys.summary })
    },
  })
  const openMap = (row: AkfaProduct) => {
    setMapping(row)
    if (row.isNew) markSeen.mutate(row.id)
  }

  const [exporting, setExporting] = useState(false)
  const exportExcel = async () => {
    setExporting(true)
    try {
      const { blob, fileName } = await akfaApi.exportUnmapped()
      saveBlob(blob, fileName)
    } catch (e) {
      toastClientError(e, t('akfa.export_failed'))
    } finally {
      setExporting(false)
    }
  }

  const columns: Column<AkfaProduct>[] = [
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
      render: (row) => (
        <input
          type="checkbox"
          className="size-4 accent-primary"
          aria-label={t('akfa.select', { name: row.name })}
          checked={selection.isChosen(row.id)}
          onChange={() => selection.toggle(row.id)}
        />
      ),
    },
    {
      key: 'name',
      title: t('akfa.newProducts.col_name'),
      render: (row) => (
        <div className="grid gap-0.5">
          <span className="flex flex-wrap items-center gap-2 font-medium">
            <Highlight text={row.name} query={search} />
            {row.isNew && <Chip tone="primary">{t('akfa.newProducts.new_badge')}</Chip>}
          </span>
          <span className="text-xs text-faint">
            #{row.externalId} · {row.externalStatus}
          </span>
        </div>
      ),
    },
    { key: 'groupName', title: t('akfa.newProducts.col_group'), render: (r) => r.groupName || '—' },
    { key: 'unitName', title: t('akfa.newProducts.col_unit'), render: (r) => r.unitName || '—' },
    {
      key: 'currentRate',
      title: t('akfa.newProducts.col_price'),
      align: 'right',
      className: 'tabular-nums whitespace-nowrap',
      render: (r) => formatPrice(r.currentRate, r.currentRateCurrency),
    },
    {
      key: 'firstSeenAt',
      title: t('akfa.newProducts.col_first_seen'),
      className: 'whitespace-nowrap',
      render: (r) => formatDateTime(r.firstSeenAt || r.externalCreatedDate) || '—',
    },
  ]

  return (
    <TableCard>
      <TableToolbar>
        <Select
          aria-label={t('akfa.filter_label')}
          className="w-auto"
          value={filters.isNew ? 'true' : ''}
          onChange={(e) => setFilters({ isNew: e.target.value === 'true' ? true : null })}
        >
          <option value="">{t('akfa.newProducts.filter_all')}</option>
          <option value="true">{t('akfa.newProducts.filter_unseen')}</option>
        </Select>
        <SearchInput
          value={search}
          onChange={(q) => setParams({ search: q, page: 1 })}
          placeholder={t('akfa.common.search_placeholder')}
          minLength={1}
        />
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          {selected.length > 0 && (
            <>
              <span className="text-sm text-muted">
                {t('akfa.common.selected_count', { count: selected.length })}
              </span>
              <Button variant="outline" onClick={() => setIgnoring(selected.map((r) => r.id))}>
                {t('akfa.newProducts.bulk_ignore')}
              </Button>
            </>
          )}
          <Button
            variant="outline"
            icon={<Download size={16} />}
            loading={exporting}
            onClick={exportExcel}
          >
            {t('akfa.newProducts.export_excel')}
          </Button>
        </div>
      </TableToolbar>

      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(r) => r.id}
        loading={list.isPending}
        fetching={list.isFetching}
        error={list.error}
        onRetry={() => list.refetch()}
        empty={search ? t('common.nothing_found') : t('akfa.newProducts.empty')}
        actions={(row) => (
          <>
            <Button size="sm" onClick={() => openMap(row)}>
              {t('akfa.newProducts.map_button')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIgnoring([row.id])}>
              {t('akfa.newProducts.ignore_button')}
            </Button>
          </>
        )}
      />
      <Pagination
        page={params.page}
        size={params.size}
        total={list.data?.total ?? 0}
        onChange={(next) => setParams(next)}
      />

      {ignoring && (
        <IgnoreDialog
          count={ignoring.length}
          onIgnore={(reason) => ignore(ignoring, reason)}
          onClose={() => setIgnoring(null)}
        />
      )}
      {mapping && (
        <MapProductDialog
          akfaProduct={mapping}
          onClose={() => setMapping(null)}
          onSaved={refresh}
        />
      )}
    </TableCard>
  )
}
