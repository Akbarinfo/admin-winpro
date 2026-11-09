import { useTranslation } from 'react-i18next'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useConfirmDelete } from '@/shared/hooks/useConfirmDelete'
import { useServerTable } from '@/shared/hooks/useServerTable'
import type { Currency } from '@/shared/lookups/currencies'
import {
  Button,
  Chip,
  DataTable,
  IconButton,
  ListLayout,
  PageHeader,
  Pagination,
  TableCard,
  type Column,
} from '@/shared/ui'
import { currencyApi, currencyKeys } from './api'

export function CurrencyListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  // Carry the table's URL params into the dialog and back, so closing it returns to the same page.
  const { search } = useLocation()

  const table = useServerTable<Currency>({
    key: 'currency',
    queryKey: currencyKeys.all,
    fetchPage: currencyApi.table,
  })

  const del = useConfirmDelete<Currency>({
    remove: (row) => currencyApi.remove(row.id),
    invalidate: currencyKeys.all,
    getName: (row) => (row.symbol ? `${row.name} (${row.symbol})` : row.name),
  })

  const columns: Column<Currency>[] = [
    { key: 'name', title: t('currency.name'), sortable: true },
    { key: 'symbol', title: t('currency.symbol'), sortable: true },
    {
      key: 'isMain',
      title: t('currency.main'),
      render: (row) => row.isMain && <Chip tone="primary">{t('currency.main')}</Chip>,
    },
  ]

  return (
    <ListLayout>
      <PageHeader
        title={t('currency.title')}
        actions={
          <Button icon={<Plus size={16} />} onClick={() => navigate({ pathname: 'add', search })}>
            {t('currency.add')}
          </Button>
        }
      />

      <TableCard>
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
          empty={t('currency.empty')}
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
