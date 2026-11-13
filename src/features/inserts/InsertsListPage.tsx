import { useTranslation } from 'react-i18next'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { Copy, Pencil, Plus, Settings2, Trash2 } from 'lucide-react'
import { useConfirmCopy } from '@/shared/hooks/useConfirmCopy'
import { useConfirmDelete } from '@/shared/hooks/useConfirmDelete'
import { useServerTable } from '@/shared/hooks/useServerTable'
import {
  Button,
  DataTable,
  IconButton,
  ListLayout,
  PageHeader,
  Pagination,
  SearchInput,
  TableCard,
  TableToolbar,
  type Column,
} from '@/shared/ui'
import { insertApi, insertKeys } from './api'
import { consistLabel } from './helpers'
import type { Consist } from './types'

/** Products that have inserts (the old InsertsLayout). */
export function InsertsListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  // Carry the table's URL params into the dialog and back, so closing it returns to the same page.
  const { search } = useLocation()

  const table = useServerTable<Consist>({
    key: 'inserts',
    queryKey: insertKeys.all,
    fetchPage: insertApi.table,
  })

  const del = useConfirmDelete<Consist>({
    remove: (row) => insertApi.remove(row.id),
    invalidate: insertKeys.all,
    getName: consistLabel,
  })
  const copy = useConfirmCopy<Consist>({
    copy: (row) => insertApi.copy(row.id),
    invalidate: insertKeys.all,
    getName: consistLabel,
  })

  // Sort names are the old headerTable's: name, article, supplier.
  const columns: Column<Consist>[] = [
    { key: 'number', title: t('common.number'), render: (_, i) => table.rowNumber(i) },
    { key: 'productName', sortKey: 'name', title: t('inserts.name'), sortable: true },
    { key: 'article', title: t('inserts.article'), sortable: true },
    { key: 'supplierName', sortKey: 'supplier', title: t('inserts.supplier'), sortable: true },
  ]

  return (
    <ListLayout>
      <PageHeader
        title={t('inserts.title')}
        actions={
          <Button icon={<Plus size={16} />} onClick={() => navigate({ pathname: 'add', search })}>
            {t('inserts.add')}
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
          error={table.error}
          onRetry={() => table.refetch()}
          empty={t('inserts.empty')}
          highlight={table.search}
          actions={(row) => (
            <>
              <IconButton
                label={t('inserts.open')}
                onClick={() =>
                  navigate(`/inserts/layout/page/${row.id}`, {
                    state: { name: consistLabel(row) },
                  })
                }
              >
                <Settings2 size={16} />
              </IconButton>
              <IconButton label={t('common.copy')} onClick={() => copy.request(row)}>
                <Copy size={16} />
              </IconButton>
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
      {copy.dialog}
      {/* add / update/:id render the form dialog over the list */}
      <Outlet />
    </ListLayout>
  )
}
