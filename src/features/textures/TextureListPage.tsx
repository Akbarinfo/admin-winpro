import { useTranslation } from 'react-i18next'
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router'
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
import { textureApi, textureKeys } from './api'
import { ColorSwatch } from './ColorSwatch'
import { TextureMatches } from './TextureMatches'
import type { Texture } from './types'

export function TextureListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  // Carry the table's URL params into the dialog and back, so closing it returns to the same page.
  const { search } = useLocation()
  // The texture whose matches are shown below — in the URL, like the rest of the table state.
  const [params, setParams] = useSearchParams()
  const selectedId = Number(params.get('texture')) || null
  const select = (row: Texture) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('texture', String(row.id))
        return next
      },
      { replace: true },
    )

  const table = useServerTable<Texture>({
    key: 'textures',
    queryKey: textureKeys.all,
    fetchPage: textureApi.table,
  })

  const del = useConfirmDelete<Texture>({
    remove: (row) => textureApi.remove(row.id),
    invalidate: textureKeys.all,
    getName: (row) => row.name,
  })

  const columns: Column<Texture>[] = [
    {
      key: 'number',
      title: t('common.number'),
      className: 'w-14 text-faint tabular-nums',
      render: (_, index) => table.rowNumber(index),
    },
    {
      key: 'image',
      title: t('textures.image'),
      className: 'w-20',
      render: (row) => <Thumbnail src={fileUrl('texture', row.imageId)} />,
    },
    {
      key: 'name',
      title: t('textures.name'),
      sortable: true,
      className: 'font-medium',
      render: (row) => <Highlight text={row.name} query={table.search} />,
    },
    {
      key: 'color',
      title: t('textures.color'),
      sortable: true,
      render: (row) => <ColorSwatch color={row.color} />,
    },
    { key: 'priority', title: t('textures.priority'), align: 'right', className: 'tabular-nums' },
  ]

  return (
    <ListLayout>
      <PageHeader
        title={t('textures.title')}
        actions={
          <Button icon={<Plus size={16} />} onClick={() => navigate({ pathname: 'add', search })}>
            {t('textures.add')}
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
          selectedKey={selectedId}
          onRowClick={select}
          error={table.error}
          onRetry={() => table.refetch()}
          empty={table.search ? t('common.nothing_found') : t('textures.empty')}
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

      <TextureMatches textureId={selectedId} />

      {del.dialog}
      {/* add / update/:id render the form dialog over the list */}
      <Outlet />
    </ListLayout>
  )
}
