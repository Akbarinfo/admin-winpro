import { useTranslation } from 'react-i18next'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { Copy, Pencil, Plus, Settings2, Trash2 } from 'lucide-react'
import { useConfirmCopy } from '@/shared/hooks/useConfirmCopy'
import { useConfirmDelete } from '@/shared/hooks/useConfirmDelete'
import { useServerTable } from '@/shared/hooks/useServerTable'
import { formatNumber } from '@/shared/lib/format'
import {
  Button,
  Chip,
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
import { fillingApi, fillingKeys } from './api'
import type { FillingGroup } from './types'

/** Filling groups (the old Filling layout). */
export function FillingListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  // Carry the table's URL params into the dialog and back, so closing it returns to the same page.
  const { search } = useLocation()

  const table = useServerTable<FillingGroup>({
    key: 'filling',
    queryKey: fillingKeys.all,
    fetchPage: fillingApi.table,
  })

  const del = useConfirmDelete<FillingGroup>({
    remove: (row) => fillingApi.remove(row.id),
    invalidate: fillingKeys.all,
    getName: (row) => row.name ?? '',
  })
  const copy = useConfirmCopy<FillingGroup>({
    copy: (row) => fillingApi.copy(row.id),
    invalidate: fillingKeys.all,
    getName: (row) => row.name ?? '',
  })

  const columns: Column<FillingGroup>[] = [
    { key: 'number', title: t('common.number'), render: (_, i) => table.rowNumber(i) },
    { key: 'name', title: t('fillingGroups.name'), sortable: true },
    {
      key: 'clearance',
      title: t('fillingGroups.clearance'),
      sortable: true,
      align: 'right',
      render: (row) => <span className="tabular-nums">{formatNumber(row.clearance)}</span>,
    },
    {
      key: 'outer',
      title: t('fillingGroups.outer'),
      render: (row) => row.outer && <Chip tone="primary">{t('fillingGroups.outer')}</Chip>,
    },
    {
      key: 'inner',
      title: t('fillingGroups.inner'),
      render: (row) => row.inner && <Chip tone="primary">{t('fillingGroups.inner')}</Chip>,
    },
  ]

  return (
    <ListLayout>
      <PageHeader
        title={t('fillingGroups.title')}
        actions={
          <Button icon={<Plus size={16} />} onClick={() => navigate({ pathname: 'add', search })}>
            {t('fillingGroups.add')}
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
          empty={t('fillingGroups.empty')}
          highlight={table.search}
          actions={(row) => (
            <>
              <IconButton
                label={t('fillingGroups.open')}
                onClick={() =>
                  navigate(`/filling/specification/${row.id}`, { state: { name: row.name } })
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
