import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { AlertTriangle, Copy, FilterX, Pencil, Plus, Trash2 } from 'lucide-react'
import { useConfirmDelete } from '@/shared/hooks/useConfirmDelete'
import { useServerTable } from '@/shared/hooks/useServerTable'
import { useTableFilters } from '@/shared/hooks/useTableFilters'
import { formatNumber } from '@/shared/lib/format'
import { profileSystemLabel, useProfileSystems } from '@/shared/lookups/profileSystems'
import { useSeriesList } from '@/shared/lookups/series'
import { useSuppliers } from '@/shared/lookups/suppliers'
import {
  Button,
  Checkbox,
  Combobox,
  ConfirmDialog,
  DataTable,
  Highlight,
  IconButton,
  ListLayout,
  PageHeader,
  Pagination,
  SearchInput,
  TableCard,
  TableToolbar,
  type Column,
} from '@/shared/ui'
import { productApi, productKeys } from './api'
import { PRODUCT_FILTERS } from './filters'
import { groupPath, type ProductGroup } from './groups'
import type { ProductRow } from './types'

/** The old list sorted by id, oldest first. */
const DEFAULT_SORT = { column: 'id', dir: 'asc' } as const

const byId = <T extends { id: number }>(list: T[] | undefined, id: number | null) =>
  (id !== null && list?.find((item) => item.id === id)) || null

export function ProductListPage({ group }: { group: ProductGroup }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { pathname, search } = useLocation()
  // The form returns to this exact page of the list, with its filters and sort.
  const openForm = (to: string) => navigate(to, { state: { from: pathname + search } })

  const { filters, setFilters, clear, active } = useTableFilters(group.key, PRODUCT_FILTERS)

  const table = useServerTable<ProductRow>({
    key: group.key,
    queryKey: productKeys.all,
    fetchPage: productApi.table,
    filter: { ...filters, groupType: group.groupType },
    defaultSort: DEFAULT_SORT,
  })

  const series = useSeriesList()
  const suppliers = useSuppliers()
  const profileSystems = useProfileSystems()
  const types = useQuery({
    queryKey: productKeys.articleTypes(group.groupType),
    queryFn: ({ signal }) => productApi.articleTypes(group.groupType, signal),
    staleTime: 10 * 60_000,
  })

  const del = useConfirmDelete<ProductRow>({
    remove: (row) => productApi.remove(row.id),
    invalidate: productKeys.all,
    getName: (row) => row.name,
  })

  const [copying, setCopying] = useState<ProductRow | null>(null)
  const copy = useMutation({
    mutationFn: (row: ProductRow) => productApi.copy(row.id),
    onSuccess: async (created) => {
      setCopying(null)
      await queryClient.invalidateQueries({ queryKey: productKeys.all })
      openForm(`${groupPath(group)}/update/${created.id}`)
    },
    onError: () => setCopying(null),
  })

  const searchText = filters.searchTxt ?? ''
  const columns: Column<ProductRow>[] = [
    { key: 'id', title: 'ID', className: 'w-16 tabular-nums text-faint' },
    {
      key: 'name',
      title: t('product.name'),
      sortable: true,
      className: 'font-medium',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5">
          <Highlight text={row.name} query={searchText} />
          {row.hasPriceWarning && (
            <AlertTriangle
              size={15}
              className="shrink-0 text-warn"
              aria-label={t('product.price_warning_hint')}
            >
              <title>{t('product.price_warning_hint')}</title>
            </AlertTriangle>
          )}
        </span>
      ),
    },
    {
      key: 'nameInCatalog',
      title: t('product.name_in_catalog'),
      sortKey: 'directory_name',
    },
    {
      key: 'article',
      title: t('product.article'),
      sortable: true,
      render: (row) => <Highlight text={row.article} query={searchText} />,
    },
    {
      key: 'profileType',
      title: t('product.type'),
      render: (row) => (row.profileType ? t(row.profileType) : ''),
    },
    { key: 'supplierName', title: t('product.supplier'), sortKey: 'supplier' },
    { key: 'unitName', title: t('product.unit') },
  ]
  if (group.columns.series)
    columns.push({
      key: 'productSeriesName',
      title: t('product.series'),
      sortKey: 'series',
    })
  if (group.columns.usefulPiece)
    columns.push({
      key: 'usefulPiece',
      title: t('product.useful_piece'),
      align: 'right',
      render: (row) => <span className="tabular-nums">{formatNumber(row.usefulPiece)}</span>,
    })
  if (group.columns.wastePercent)
    columns.push({
      key: 'wastePercent',
      title: t('product.waste_percent'),
      align: 'right',
      render: (row) => <span className="tabular-nums">{formatNumber(row.wastePercent)}</span>,
    })

  return (
    <ListLayout>
      <PageHeader
        title={t(group.title)}
        actions={
          <Button icon={<Plus size={16} />} onClick={() => openForm(`${groupPath(group)}/add`)}>
            {t(group.addLabel)}
          </Button>
        }
      />

      <TableCard>
        <TableToolbar>
          <SearchInput
            value={searchText}
            onChange={(searchTxt) => setFilters({ searchTxt })}
            placeholder={t('product.search')}
            minLength={1}
            className="w-full sm:w-64"
          />
          {group.filters.series && (
            <div className="w-full sm:w-48">
              <Combobox
                aria-label={t('product.series')}
                placeholder={t('product.series')}
                options={series.data ?? []}
                value={byId(series.data, filters.productSeriesId)}
                onChange={(s) => setFilters({ productSeriesId: s?.id ?? null })}
                getKey={(s) => s.id}
                getLabel={(s) => s.name}
                loading={series.isPending}
                clearable
              />
            </div>
          )}
          <div className="w-full sm:w-48">
            <Combobox
              aria-label={t('product.supplier')}
              placeholder={t('product.supplier')}
              options={suppliers.data ?? []}
              value={byId(suppliers.data, filters.supplierId)}
              onChange={(s) => setFilters({ supplierId: s?.id ?? null })}
              getKey={(s) => s.id}
              getLabel={(s) => s.name}
              loading={suppliers.isPending}
              clearable
            />
          </div>
          <div className="w-full sm:w-44">
            <Combobox
              aria-label={t('product.type')}
              placeholder={t('product.type')}
              options={types.data ?? []}
              value={types.data?.find((x) => x.name === filters.type) ?? null}
              onChange={(x) => setFilters({ type: x?.name ?? null })}
              getKey={(x) => x.name}
              getLabel={(x) => t(x.name)}
              loading={types.isPending}
              clearable
            />
          </div>
          {group.filters.profileSystem && (
            <div className="w-full sm:w-56">
              <Combobox
                aria-label={t('product.profile_system')}
                placeholder={t('product.profile_system')}
                options={profileSystems.data ?? []}
                value={byId(profileSystems.data, filters.profileSystemId)}
                onChange={(s) => setFilters({ profileSystemId: s?.id ?? null })}
                getKey={(s) => s.id}
                getLabel={profileSystemLabel}
                loading={profileSystems.isPending}
                clearable
              />
            </div>
          )}
          <Checkbox
            checked={filters.hasPriceWarning === true}
            onChange={(e) => setFilters({ hasPriceWarning: e.target.checked ? true : null })}
            label={
              <span className="inline-flex items-center gap-1.5">
                <AlertTriangle size={15} className="text-warn" aria-hidden="true" />
                {t('product.price_warning')}
              </span>
            }
          />
          {active && (
            <Button variant="ghost" size="sm" icon={<FilterX size={15} />} onClick={clear}>
              {t('product.clear_filters')}
            </Button>
          )}
        </TableToolbar>

        <DataTable
          columns={columns}
          rows={table.rows}
          getRowKey={(row) => row.id}
          loading={table.isLoading}
          fetching={table.isFetching}
          sort={table.sort}
          onSortChange={table.onSortChange}
          error={table.error}
          onRetry={() => table.refetch()}
          highlight={searchText}
          empty={t('product.empty')}
          actions={(row) => (
            <>
              <IconButton label={t('product.copy')} onClick={() => setCopying(row)}>
                <Copy size={16} />
              </IconButton>
              <IconButton
                label={t('common.edit')}
                onClick={() => openForm(`${groupPath(group)}/update/${row.id}`)}
              >
                <Pencil size={16} />
              </IconButton>
              <IconButton label={t('common.delete')} tone="danger" onClick={() => del.request(row)}>
                <Trash2 size={16} />
              </IconButton>
            </>
          )}
        />
        <Pagination {...table.pagination} />
      </TableCard>

      {del.dialog}
      <ConfirmDialog
        open={copying !== null}
        tone="primary"
        title={t('product.copy_title')}
        description={t('product.copy_text', { name: copying?.name ?? '' })}
        confirmLabel={t('product.copy')}
        loading={copy.isPending}
        onConfirm={() => copying && copy.mutate(copying)}
        onCancel={() => !copy.isPending && setCopying(null)}
      />
    </ListLayout>
  )
}
