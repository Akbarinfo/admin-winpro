import { useTranslation } from 'react-i18next'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useConfirmDelete } from '@/shared/hooks/useConfirmDelete'
import { useServerTable } from '@/shared/hooks/useServerTable'
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
import { userApi, userKeys } from './api'
import type { User } from './types'

export function UserListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  // Carry the table's URL params into the dialog and back, so closing it returns to the same page.
  const { search } = useLocation()

  const table = useServerTable<User>({
    key: 'users',
    queryKey: userKeys.all,
    fetchPage: userApi.table,
  })

  const del = useConfirmDelete<User>({
    remove: (row) => userApi.remove(row.id),
    invalidate: userKeys.all,
    getName: (row) => row.fullName || row.username || '',
  })

  // The old panel had no sorting here.
  const columns: Column<User>[] = [
    {
      key: 'number',
      title: t('common.number'),
      className: 'w-14 text-faint tabular-nums',
      render: (_, index) => table.rowNumber(index),
    },
    {
      key: 'fullName',
      title: t('users.full_name'),
      className: 'font-medium',
      render: (row) => <Highlight text={row.fullName ?? ''} query={table.search} />,
    },
    { key: 'username', title: t('users.username') },
    { key: 'phone', title: t('users.phone'), className: 'tabular-nums whitespace-nowrap' },
    {
      key: 'role',
      title: t('users.role'),
      render: (row) => (row.role ? <Chip>{row.role}</Chip> : '—'),
    },
  ]

  return (
    <ListLayout>
      <PageHeader
        title={t('users.title')}
        actions={
          <Button icon={<Plus size={16} />} onClick={() => navigate({ pathname: 'add', search })}>
            {t('users.add')}
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
          highlight={table.search}
          error={table.error}
          onRetry={() => table.refetch()}
          empty={table.search ? t('common.nothing_found') : t('users.empty')}
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
