import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Copy, Pencil, Plus, Settings2, Trash2 } from 'lucide-react'
import { useChosenId } from '@/shared/hooks/useChosenId'
import { useConfirmCopy } from '@/shared/hooks/useConfirmCopy'
import { useConfirmDelete } from '@/shared/hooks/useConfirmDelete'
import { useServerTable } from '@/shared/hooks/useServerTable'
import { formatNumber } from '@/shared/lib/format'
import { ParameterPanel } from '@/shared/parameters'
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
import { ACCESSORY_PARAMETERS, furnitureApi, furnitureKeys } from './api'
import { SidesPanel } from './SidesPanel'
import type { Accessory } from './types'

const num = (value: number | null | undefined) => (
  <span className="tabular-nums">{formatNumber(value)}</span>
)

/**
 * Fitting sets (the old AccessoriesLayout). A row opens under itself its sides, drawn on a sash, and
 * its parameters (design variant C); the opened one is kept in the URL (?accessoryId).
 */
export function FurnitureListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const chosen = useChosenId('accessoryId')

  const table = useServerTable<Accessory>({
    key: 'furniture',
    queryKey: furnitureKeys.all,
    fetchPage: furnitureApi.table,
  })

  const del = useConfirmDelete<Accessory>({
    remove: (row) => furnitureApi.remove(row.id),
    invalidate: furnitureKeys.all,
    onDeleted: (row) => chosen.drop(row.id),
    getName: (row) => row.name ?? '',
  })
  const copy = useConfirmCopy<Accessory>({
    copy: (row) => furnitureApi.copy(row.id),
    invalidate: furnitureKeys.all,
    getName: (row) => row.name ?? '',
  })

  // Sortable as in the old headerTable: name, shortName, openingType, accessoriesType.
  const columns: Column<Accessory>[] = [
    { key: 'name', title: t('furniture.name'), sortable: true },
    { key: 'shortName', title: t('furniture.short_name'), sortable: true },
    {
      key: 'openingType',
      title: t('furniture.opening_type'),
      sortable: true,
      render: (row) => (row.openingType ? t(row.openingType) : ''),
    },
    {
      key: 'openingSide',
      title: t('furniture.opening_side'),
      // the old list showed «Внутрь» when the record had none
      render: (row) => t(row.openingSide || 'INWARD'),
    },
    {
      key: 'accessoriesType',
      title: t('furniture.type'),
      sortable: true,
      render: (row) => (row.accessoriesType ? t(row.accessoriesType) : ''),
    },
    {
      key: 'door',
      title: t('furniture.door'),
      render: (row) => row.door && <Chip tone="primary">{t('furniture.door')}</Chip>,
    },
    {
      key: 'handleSide',
      title: t('furniture.handle_side'),
      align: 'right',
      render: (r) => num(r.handleSide),
    },
    {
      key: 'maxHalfPerimeter',
      title: t('furniture.max_half_perimeter'),
      align: 'right',
      render: (r) => num(r.maxHalfPerimeter),
    },
    {
      key: 'maxHeight',
      title: t('furniture.max_height'),
      align: 'right',
      render: (r) => num(r.maxHeight),
    },
    {
      key: 'maxWidth',
      title: t('furniture.max_width'),
      align: 'right',
      render: (r) => num(r.maxWidth),
    },
    {
      key: 'maxSash',
      title: t('furniture.max_sash'),
      align: 'right',
      render: (r) => num(r.maxSash),
    },
  ]

  return (
    <ListLayout>
      <PageHeader
        title={t('furniture.title')}
        actions={
          <Button icon={<Plus size={16} />} onClick={() => navigate('/furniture/add')}>
            {t('furniture.add')}
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
          empty={t('furniture.empty')}
          highlight={table.search}
          expandable={{
            isExpanded: (row) => row.id === chosen.id,
            onToggle: (row) => (row.id === chosen.id ? chosen.drop(row.id) : chosen.choose(row.id)),
            render: (row) => (
              <div className="grid gap-3 lg:grid-cols-2">
                <SidesPanel accessoryId={row.id} />
                <ParameterPanel
                  title={t('furniture.params')}
                  endpoint={ACCESSORY_PARAMETERS}
                  parentId={row.id}
                  tableKey="aparam"
                  hint=""
                />
              </div>
            ),
            label: (row, open) =>
              t(open ? 'furniture.sides.hide' : 'furniture.sides.show', { name: row.name ?? '' }),
          }}
          actions={(row) => (
            <>
              <IconButton
                label={t('furniture.open')}
                onClick={() =>
                  navigate(`/furniture/main/specification/${row.id}`, {
                    state: { name: row.name },
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
                onClick={() => navigate(`/furniture/update/${row.id}`)}
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
    </ListLayout>
  )
}
