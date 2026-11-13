import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { fileUrl } from '@/shared/api/files'
import { useConfirmDelete } from '@/shared/hooks/useConfirmDelete'
import { useServerTable } from '@/shared/hooks/useServerTable'
import { Button, Chip, DataTable, IconButton, Pagination, Panel, type Column } from '@/shared/ui'
import { connectionApi, connectionKeys } from './api'
import { TypeDialog } from './TypeDialog'
import type { ConnectionType } from './types'

type TypesPanelProps = {
  connectionId: string
  selectedId: number | null
  onSelect: (id: number) => void
  /** A row was deleted (the page drops it if it was chosen). */
  onDeleted: (id: number) => void
}

/** The connection's variants (the old ConnectionTypeTable): added and deleted, not edited. */
export function TypesPanel({ connectionId, selectedId, onSelect, onDeleted }: TypesPanelProps) {
  const { t } = useTranslation()
  const [adding, setAdding] = useState(false)

  const table = useServerTable<ConnectionType>({
    key: 'types',
    queryKey: connectionKeys.types,
    fetchPage: connectionApi.types,
    filter: { connectionId },
    defaultSize: 10,
  })

  const del = useConfirmDelete<ConnectionType>({
    remove: (row) => connectionApi.removeType(row.id),
    invalidate: connectionKeys.types,
    onDeleted: (row) => onDeleted(row.id),
    getName: (row) => row.name ?? '',
  })

  const columns: Column<ConnectionType>[] = [
    {
      key: 'priority',
      title: t('connection.types.priority'),
      sortable: true,
      className: 'w-24',
      render: (row) => <span className="tabular-nums">{row.priority}</span>,
    },
    {
      key: 'icon',
      title: t('connection.types.icon'),
      className: 'w-20',
      render: (row) =>
        row.connectionTypeIndex != null && (
          <img
            src={fileUrl('connection', row.connectionTypeIndex)}
            alt=""
            loading="lazy"
            className="size-7 rounded-md border border-line object-contain"
          />
        ),
    },
    { key: 'name', title: t('connection.types.name'), sortable: true },
    {
      key: 'isDefault',
      title: t('connection.types.default'),
      render: (row) => row.isDefault && <Chip tone="primary">{t('connection.types.default')}</Chip>,
    },
  ]

  return (
    <Panel
      title={t('connection.types.title')}
      actions={
        <Button size="sm" icon={<Plus size={16} />} onClick={() => setAdding(true)}>
          {t('common.add')}
        </Button>
      }
    >
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
        empty={t('connection.types.empty')}
        selectedKey={selectedId}
        onRowClick={(row) => onSelect(row.id)}
        skeletonRows={3}
        actions={(row) => (
          <IconButton label={t('common.delete')} tone="danger" onClick={() => del.request(row)}>
            <Trash2 size={16} />
          </IconButton>
        )}
      />
      <Pagination {...table.pagination} />

      {del.dialog}
      {adding && <TypeDialog connectionId={connectionId} onClose={() => setAdding(false)} />}
    </Panel>
  )
}
