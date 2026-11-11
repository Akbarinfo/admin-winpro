import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
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
import { templateApi, templateKeys } from './api'
import { typeName, type TemplateRow } from './types'

/** /templates (the old layout/templates/Templates). */
export function TemplateListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const openForm = (to: string) => navigate(to, { state: { from: pathname + search } })

  const table = useServerTable<TemplateRow>({
    key: 'templates',
    queryKey: templateKeys.all,
    fetchPage: templateApi.table,
    // as the old list: 20 a page
    defaultSize: 20,
  })
  const del = useConfirmDelete<TemplateRow>({
    remove: (row) => templateApi.remove(row.id),
    invalidate: templateKeys.all,
    getName: (row) => row.name ?? '',
  })

  const columns: Column<TemplateRow>[] = [
    { key: 'id', title: 'ID', className: 'w-16 text-faint tabular-nums' },
    {
      key: 'image',
      title: <span className="sr-only">{t('templates.image')}</span>,
      className: 'w-14',
      render: (row) => <Thumbnail src={fileUrl('template', row.imageId)} />,
    },
    {
      key: 'name',
      title: t('templates.name'),
      sortable: true,
      className: 'font-medium',
      render: (row) => <Highlight text={row.name ?? ''} query={table.search} />,
    },
    { key: 'type', title: t('templates.type'), sortable: true, render: typeName },
  ]

  return (
    <ListLayout>
      <PageHeader
        title={t('templates.title')}
        actions={
          <Button icon={<Plus size={16} />} onClick={() => openForm('add')}>
            {t('templates.add')}
          </Button>
        }
      />
      <TableCard>
        <TableToolbar>
          {/* the old search sent every keystroke */}
          <SearchInput value={table.search} onChange={table.onSearchChange} minLength={1} />
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
          empty={table.search ? t('common.nothing_found') : t('templates.empty')}
          actions={(row) => (
            <>
              <IconButton label={t('common.edit')} onClick={() => openForm(`update/${row.id}`)}>
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
    </ListLayout>
  )
}
