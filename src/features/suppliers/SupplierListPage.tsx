import { useTranslation } from 'react-i18next'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { fileUrl } from '@/shared/api/files'
import { useConfirmDelete } from '@/shared/hooks/useConfirmDelete'
import { useServerTable } from '@/shared/hooks/useServerTable'
import {
  Button,
  DataTable,
  Highlight,
  IconButton,
  ListLayout,
  PageHeader,
  Pagination,
  SearchInput,
  TableCard,
  TableToolbar,
  Thumbnail,
  type Column,
} from '@/shared/ui'
import { supplierApi, supplierKeys } from './api'
import { parseTypes, type Supplier } from './types'

export function SupplierListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  // Carry the table's URL params into the dialog and back, so closing it returns to the same page.
  const { search } = useLocation()

  const table = useServerTable<Supplier>({
    key: 'suppliers',
    queryKey: supplierKeys.all,
    fetchPage: supplierApi.table,
  })

  const del = useConfirmDelete<Supplier>({
    remove: (row) => supplierApi.remove(row.id),
    invalidate: supplierKeys.all,
    getName: (row) => row.name,
  })

  // Sort names are the old panel's header keys, which differ from the field names.
  const columns: Column<Supplier>[] = [
    {
      key: 'number',
      title: t('common.number'),
      className: 'w-14 text-faint tabular-nums',
      render: (_, index) => table.rowNumber(index),
    },
    {
      key: 'logo',
      title: <span className="sr-only">{t('suppliers.logo')}</span>,
      className: 'w-12',
      render: (row) => <Thumbnail src={fileUrl('supplier', row.logoId)} />,
    },
    {
      key: 'name',
      title: t('suppliers.name'),
      sortable: true,
      className: 'font-medium',
      render: (row) => <Highlight text={row.name} query={table.search} />,
    },
    { key: 'currencyName', title: t('suppliers.currency'), sortable: true, sortKey: 'currency' },
    { key: 'country', title: t('suppliers.country'), sortable: true },
    {
      key: 'address',
      title: t('suppliers.address'),
      sortable: true,
      className: 'max-w-[260px] truncate text-muted',
    },
    {
      key: 'phone',
      title: t('suppliers.phone'),
      sortable: true,
      sortKey: 'phone_number',
      className: 'tabular-nums',
    },
    {
      key: 'types',
      title: t('suppliers.types'),
      sortable: true,
      sortKey: 'type_supplier',
      className: 'max-w-[260px] truncate',
      render: (row) =>
        parseTypes(row.types)
          .map((type) => t(type))
          .join(', '),
    },
  ]

  return (
    <ListLayout>
      <PageHeader
        title={t('suppliers.title')}
        actions={
          <Button icon={<Plus size={16} />} onClick={() => navigate({ pathname: 'add', search })}>
            {t('suppliers.add')}
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
          empty={table.search ? t('common.nothing_found') : t('suppliers.empty')}
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
