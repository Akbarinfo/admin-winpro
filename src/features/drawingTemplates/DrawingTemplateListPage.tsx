import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { fileUrl } from '@/shared/api/files'
import { useConfirmDelete } from '@/shared/hooks/useConfirmDelete'
import { useServerTable } from '@/shared/hooks/useServerTable'
import { formatNumber } from '@/shared/lib/format'
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
import { drawingTemplateApi, drawingTemplateKeys } from './api'
import type { DrawingTemplateRow } from './types'

/** /templetes (the old layout/templete/DrawingTemplete). */
export function DrawingTemplateListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const openForm = (to: string) => navigate(to, { state: { from: pathname + search } })

  const table = useServerTable<DrawingTemplateRow>({
    key: 'templetes',
    queryKey: drawingTemplateKeys.all,
    fetchPage: drawingTemplateApi.table,
    // as the old list: 20 a page
    defaultSize: 20,
  })
  const del = useConfirmDelete<DrawingTemplateRow>({
    remove: (row) => drawingTemplateApi.remove(row.id),
    invalidate: drawingTemplateKeys.all,
    getName: (row) => row.name ?? '',
  })

  const size = (value?: number | null) => (value == null ? '' : formatNumber(value))
  const columns: Column<DrawingTemplateRow>[] = [
    { key: 'id', title: 'ID', className: 'w-16 text-faint tabular-nums' },
    {
      key: 'image',
      title: <span className="sr-only">{t('drawingTemplates.image')}</span>,
      className: 'w-14',
      render: (row) => <Thumbnail src={fileUrl('templete', row.imageId)} />,
    },
    {
      key: 'name',
      title: t('drawingTemplates.name'),
      sortable: true,
      className: 'font-medium',
      render: (row) => <Highlight text={row.name ?? ''} query={table.search} />,
    },
    { key: 'profileSystemName', title: t('drawingTemplates.profile_system'), sortable: true },
    { key: 'textureName', title: t('drawingTemplates.texture'), sortable: true },
    {
      key: 'type',
      title: t('drawingTemplates.type'),
      sortable: true,
      // shown as it comes, as the old list did
    },
    {
      key: 'width',
      title: t('drawingTemplates.width'),
      sortable: true,
      align: 'right',
      className: 'tabular-nums',
      render: (row) => size(row.width),
    },
    {
      key: 'height',
      title: t('drawingTemplates.height'),
      sortable: true,
      align: 'right',
      className: 'tabular-nums',
      render: (row) => size(row.height),
    },
  ]

  return (
    <ListLayout>
      <PageHeader
        title={t('drawingTemplates.title')}
        actions={
          <Button icon={<Plus size={16} />} onClick={() => openForm('add')}>
            {t('drawingTemplates.add')}
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
          empty={table.search ? t('common.nothing_found') : t('drawingTemplates.empty')}
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
