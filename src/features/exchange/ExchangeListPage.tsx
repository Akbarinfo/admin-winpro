import { useTranslation } from 'react-i18next'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useConfirmDelete } from '@/shared/hooks/useConfirmDelete'
import { useServerTable } from '@/shared/hooks/useServerTable'
import { formatDate, formatNumber } from '@/shared/lib/format'
import {
  Button,
  DataTable,
  IconButton,
  ListLayout,
  PageHeader,
  Pagination,
  TableCard,
  type Column,
} from '@/shared/ui'
import { exchangeApi, exchangeKeys } from './api'
import type { Exchange } from './types'

export function ExchangeListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  // Carry the table's URL params into the dialog and back, so closing it returns to the same page.
  const { search } = useLocation()

  const table = useServerTable<Exchange>({
    key: 'exchange',
    queryKey: exchangeKeys.all,
    fetchPage: exchangeApi.table,
  })

  const del = useConfirmDelete<Exchange>({
    remove: (row) => exchangeApi.remove(row.id),
    invalidate: exchangeKeys.all,
    getName: (row) => `${row.fromName} → ${row.toName}, ${formatDate(row.date)}`,
  })

  const columns: Column<Exchange>[] = [
    { key: 'fromName', title: t('exchange.from') },
    { key: 'toName', title: t('exchange.to') },
    {
      key: 'date',
      title: t('exchange.date'),
      sortable: true,
      // The backend sorts exchange rates by this name — the old panel sent the header's i18n key.
      sortKey: 'table.exchange.date',
      render: (row) => <span className="tabular-nums">{formatDate(row.date)}</span>,
    },
    {
      key: 'rate',
      title: t('exchange.rate'),
      align: 'right',
      render: (row) => <span className="font-medium tabular-nums">{formatNumber(row.rate)}</span>,
    },
  ]

  return (
    <ListLayout>
      <PageHeader
        title={t('exchange.title')}
        actions={
          <Button icon={<Plus size={16} />} onClick={() => navigate({ pathname: 'add', search })}>
            {t('exchange.add')}
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
          empty={
            table.error ? (
              <span>
                {t('common.load_error')}{' '}
                <button
                  type="button"
                  className="font-medium text-primary-strong hover:underline"
                  onClick={() => table.refetch()}
                >
                  {t('common.retry')}
                </button>
              </span>
            ) : (
              t('exchange.empty')
            )
          }
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
