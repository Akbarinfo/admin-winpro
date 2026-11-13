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
import { connectionApi, connectionKeys } from './api'
import { connectionName } from './helpers'
import type { Connection } from './types'

export function ConnectionListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  // Carry the table's URL params into the dialog and back, so closing it returns to the same page.
  const { search } = useLocation()

  const table = useServerTable<Connection>({
    key: 'connection',
    queryKey: connectionKeys.all,
    fetchPage: connectionApi.table,
  })

  const del = useConfirmDelete<Connection>({
    remove: (row) => connectionApi.remove(row.id),
    invalidate: connectionKeys.all,
    getName: connectionName,
  })
  const copy = useConfirmCopy<Connection>({
    copy: (row) => connectionApi.copy(row.id),
    invalidate: connectionKeys.all,
    getName: connectionName,
  })

  // Sort names are the old headerTable's (i18n keys), not the fields.
  const columns: Column<Connection>[] = [
    { key: 'number', title: t('common.number'), render: (_, i) => table.rowNumber(i) },
    {
      key: 'article1',
      sortKey: 'table.connection.article_1',
      title: t('connection.article_1'),
      sortable: true,
    },
    {
      key: 'article2',
      sortKey: 'table.connection.article_2',
      title: t('connection.article_2'),
      sortable: true,
    },
    { key: 'name', title: t('connection.name'), render: connectionName },
  ]

  return (
    <ListLayout>
      <PageHeader
        title={t('connection.title')}
        actions={
          <Button icon={<Plus size={16} />} onClick={() => navigate({ pathname: 'add', search })}>
            {t('connection.add')}
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
          empty={t('connection.empty')}
          highlight={table.search}
          actions={(row) => (
            <>
              <IconButton
                label={t('connection.variants')}
                onClick={() =>
                  navigate(`/connection/type/${row.id}`, { state: { name: connectionName(row) } })
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
