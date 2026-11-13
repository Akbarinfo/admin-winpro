import type { QueryKey } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import type { TableBody, TablePage } from '@/shared/api/table'
import { useConfirmDelete } from '@/shared/hooks/useConfirmDelete'
import { useServerTable } from '@/shared/hooks/useServerTable'
import {
  Button,
  Chip,
  DataTable,
  IconButton,
  Pagination,
  Panel,
  SearchInput,
  TableToolbar,
  type Column,
} from '@/shared/ui'
import { furnitureKeys } from './api'
import type { AccessorySpecification } from './types'

type SpecTablePanelProps = {
  title: ReactNode
  /** Beside the add button (e.g. the main/track switch). */
  headerExtra?: ReactNode
  /** URL prefix of the table's params. */
  tableKey: string
  /** The level's own query key (furnitureKeys.level). */
  queryKey: QueryKey
  fetchPage: (body: TableBody, signal: AbortSignal) => Promise<TablePage<AccessorySpecification>>
  filter: object
  remove: (row: AccessorySpecification) => Promise<unknown>
  selectedId: number | null
  onSelect: (id: number) => void
  onDeleted: (id: number) => void
  /** The «default» column (main specification). */
  showDefault?: boolean
  /** Copy buttons and the like, before edit and delete. */
  extraActions?: (row: AccessorySpecification) => ReactNode
  /** The add (id undefined) / edit dialog. */
  dialog: (id: string | undefined, onClose: () => void) => ReactNode
}

/**
 * One level of an accessory's specification (main/track, dependent, inner): searched on the
 * server, newest first and not sortable (the old tables had no sorting), a row click chooses it.
 */
export function SpecTablePanel({
  title,
  headerExtra,
  tableKey,
  queryKey,
  fetchPage,
  filter,
  remove,
  selectedId,
  onSelect,
  onDeleted,
  showDefault,
  extraActions,
  dialog,
}: SpecTablePanelProps) {
  const { t } = useTranslation()
  // null — closed; 'new' — adding; otherwise the row's id.
  const [open, setOpen] = useState<string | null>(null)

  const table = useServerTable<AccessorySpecification>({
    key: tableKey,
    queryKey,
    fetchPage,
    filter,
    defaultSize: 10,
  })

  const del = useConfirmDelete<AccessorySpecification>({
    remove,
    invalidate: furnitureKeys.specs,
    onDeleted: (row) => onDeleted(row.id),
    getName: (row) => [row.article, row.productName].filter(Boolean).join(' — '),
  })

  const columns: Column<AccessorySpecification>[] = [
    { key: 'supplierName', title: t('furniture.spec.supplier') },
    { key: 'article', title: t('furniture.spec.article') },
    { key: 'productName', title: t('furniture.spec.product') },
    { key: 'textureName', title: t('furniture.spec.texture') },
    ...(showDefault
      ? [
          {
            key: 'default',
            title: t('furniture.spec.default'),
            render: (row: AccessorySpecification) =>
              row.default && <Chip tone="primary">{t('furniture.spec.default')}</Chip>,
          },
        ]
      : []),
  ]

  return (
    <Panel
      title={title}
      actions={
        <>
          {headerExtra}
          <Button size="sm" icon={<Plus size={16} />} onClick={() => setOpen('new')}>
            {t('common.add')}
          </Button>
        </>
      }
    >
      <TableToolbar className="p-2">
        <SearchInput value={table.search} onChange={table.onSearchChange} className="w-full" />
      </TableToolbar>
      <DataTable
        columns={columns}
        rows={table.rows}
        getRowKey={(row) => row.id}
        loading={table.isLoading}
        fetching={table.isFetching}
        error={table.error}
        onRetry={() => table.refetch()}
        empty={t('furniture.spec.empty')}
        highlight={table.search}
        selectedKey={selectedId}
        onRowClick={(row) => onSelect(row.id)}
        skeletonRows={3}
        actions={(row) => (
          <>
            {extraActions?.(row)}
            <IconButton label={t('common.edit')} onClick={() => setOpen(String(row.id))}>
              <Pencil size={16} />
            </IconButton>
            <IconButton label={t('common.delete')} tone="danger" onClick={() => del.request(row)}>
              <Trash2 size={16} />
            </IconButton>
          </>
        )}
      />
      <Pagination {...table.pagination} />

      {del.dialog}
      {open !== null && dialog(open === 'new' ? undefined : open, () => setOpen(null))}
    </Panel>
  )
}

/** A level whose parent isn't chosen yet. */
export function WaitingPanel({ title, hint }: { title: ReactNode; hint: ReactNode }) {
  const { t } = useTranslation()
  return (
    <Panel
      title={title}
      actions={
        <Button size="sm" icon={<Plus size={16} />} disabled>
          {t('common.add')}
        </Button>
      }
    >
      <p className="px-4 py-10 text-center text-muted">{hint}</p>
    </Panel>
  )
}
