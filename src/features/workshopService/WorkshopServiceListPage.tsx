import { useTranslation } from 'react-i18next'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useConfirmDelete } from '@/shared/hooks/useConfirmDelete'
import { useServerTable } from '@/shared/hooks/useServerTable'
import { formatNumber } from '@/shared/lib/format'
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
import { workshopServiceApi, workshopServiceKeys } from './api'
import { useServiceTypes } from './lookups'
import type { WorkshopService } from './types'

export function WorkshopServiceListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  // Carry the table's URL params into the dialog and back, so closing it returns to the same page.
  const { search } = useLocation()

  const table = useServerTable<WorkshopService>({
    key: 'services',
    queryKey: workshopServiceKeys.all,
    fetchPage: workshopServiceApi.table,
  })
  const serviceTypes = useServiceTypes()
  const serviceTypeName = (id?: string | null) =>
    id ? (serviceTypes.data?.find((s) => s.id === id)?.name ?? id) : '—'

  const del = useConfirmDelete<WorkshopService>({
    remove: (row) => workshopServiceApi.remove(row.id),
    invalidate: workshopServiceKeys.all,
    getName: (row) => row.name,
  })

  // As in the old panel: only name and price are sortable; there is no search.
  const columns: Column<WorkshopService>[] = [
    { key: 'name', title: t('workshopService.name'), sortable: true, className: 'font-medium' },
    {
      key: 'serviceType',
      title: t('workshopService.service_type'),
      render: (row) => serviceTypeName(row.serviceType),
    },
    {
      key: 'calculationType',
      title: t('workshopService.calculation_type'),
      render: (row) => row.calculationType?.value ?? '—',
    },
    {
      key: 'price',
      title: t('workshopService.price'),
      sortable: true,
      align: 'right',
      className: 'tabular-nums',
      render: (row) => (row.price == null ? '—' : formatNumber(row.price)),
    },
    {
      key: 'currency',
      title: t('workshopService.currency'),
      render: (row) => row.currency?.name ?? '—',
    },
  ]

  return (
    <ListLayout>
      <PageHeader
        title={t('workshopService.title')}
        actions={
          <Button icon={<Plus size={16} />} onClick={() => navigate({ pathname: 'add', search })}>
            {t('workshopService.add')}
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
          empty={t('workshopService.empty')}
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
