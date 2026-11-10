import { useTranslation } from 'react-i18next'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useConfirmDelete } from '@/shared/hooks/useConfirmDelete'
import { useServerTable } from '@/shared/hooks/useServerTable'
import { formatNumber } from '@/shared/lib/format'
import {
  Button,
  Chip,
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
import { salesCategoryApi, salesCategoryKeys } from './api'
import type { SalesCategoryRow } from './types'

export function SalesCategoryListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  // Carry the table's URL params into the dialog and back, so closing it returns to the same page.
  const { search } = useLocation()

  const table = useServerTable<SalesCategoryRow>({
    key: 'categories',
    queryKey: salesCategoryKeys.all,
    fetchPage: salesCategoryApi.table,
  })

  const del = useConfirmDelete<SalesCategoryRow>({
    remove: (row) => salesCategoryApi.remove(row.id),
    invalidate: salesCategoryKeys.all,
    getName: (row) => row.name,
  })

  // The old panel also marked «tariffs» sortable, but it's a list joined on the client,
  // not a backend column — so it isn't sortable here.
  const columns: Column<SalesCategoryRow>[] = [
    {
      key: 'number',
      title: t('common.number'),
      className: 'w-14 text-faint tabular-nums',
      render: (_, index) => table.rowNumber(index),
    },
    {
      key: 'name',
      title: t('salesCategory.name'),
      sortable: true,
      className: 'font-medium',
      render: (row) => <Highlight text={row.name} query={table.search} />,
    },
    {
      key: 'price',
      title: t('salesCategory.price'),
      sortable: true,
      align: 'right',
      className: 'tabular-nums',
      render: (row) => (row.price == null ? '—' : formatNumber(row.price)),
    },
    {
      key: 'currencyName',
      title: t('salesCategory.currency'),
      render: (row) => row.currencyName ?? '—',
    },
    {
      key: 'tariffs',
      title: t('salesCategory.tariffs'),
      render: (row) =>
        row.freeForTariffs?.length ? (
          <span className="flex flex-wrap gap-1">
            {row.freeForTariffs.map((tariff) => (
              <Chip key={tariff}>{tariff}</Chip>
            ))}
          </span>
        ) : (
          '—'
        ),
    },
  ]

  return (
    <ListLayout>
      <PageHeader
        title={t('salesCategory.title')}
        actions={
          <Button icon={<Plus size={16} />} onClick={() => navigate({ pathname: 'add', search })}>
            {t('salesCategory.add')}
          </Button>
        }
      />

      <TableCard>
        <TableToolbar>
          <SearchInput value={table.search} onChange={table.onSearchChange} />
        </TableToolbar>
        <DataTable
          columns={columns}
          rows={table.rows}
          getRowKey={(row) => row.id}
          loading={table.isLoading}
          fetching={table.isFetching}
          sort={table.sort}
          onSortChange={table.onSortChange}
          highlight={table.search}
          error={table.error}
          onRetry={() => table.refetch()}
          empty={table.search ? t('common.nothing_found') : t('salesCategory.empty')}
          actions={(row) => (
            <>
              <IconButton
                label={t('common.edit')}
                onClick={() => navigate({ pathname: `update/${row.id}`, search })}
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
      {/* add / update/:id render the form dialog over the list */}
      <Outlet />
    </ListLayout>
  )
}
