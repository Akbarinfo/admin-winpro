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
import { materialTypeApi, materialTypeKeys } from './api'
import type { MaterialType } from './types'

export function MaterialTypeListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  // Carry the table's URL params into the dialog and back, so closing it returns to the same page.
  const { search } = useLocation()

  const table = useServerTable<MaterialType>({
    key: 'materialType',
    queryKey: materialTypeKeys.all,
    fetchPage: materialTypeApi.table,
  })

  const del = useConfirmDelete<MaterialType>({
    remove: (row) => materialTypeApi.remove(row.id),
    invalidate: materialTypeKeys.all,
    getName: (row) => row.name,
  })

  const columns: Column<MaterialType>[] = [
    {
      key: 'number',
      title: t('common.number'),
      className: 'w-14 text-faint tabular-nums',
      render: (_, index) => table.rowNumber(index),
    },
    {
      key: 'name',
      title: t('materialType.name'),
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center gap-2">
          <Highlight text={row.name} query={table.search} />
          {row.isDefault && <Chip tone="primary">{t('materialType.is_default')}</Chip>}
          {row.isTesting && <Chip tone="warn">{t('materialType.testing_badge')}</Chip>}
        </span>
      ),
    },
    {
      key: 'description',
      title: t('materialType.description'),
      sortable: true,
      className: 'max-w-[480px] truncate text-muted',
    },
  ]

  return (
    <ListLayout>
      <PageHeader
        title={t('materialType.title')}
        actions={
          <Button icon={<Plus size={16} />} onClick={() => navigate({ pathname: 'add', search })}>
            {t('materialType.add')}
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
          empty={table.search ? t('common.nothing_found') : t('materialType.empty')}
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
