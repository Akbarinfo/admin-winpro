import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useConfirmDelete } from '@/shared/hooks/useConfirmDelete'
import { useServerTable } from '@/shared/hooks/useServerTable'
import { Button, DataTable, IconButton, Pagination, Panel, type Column } from '@/shared/ui'
import { connectionApi, connectionKeys } from './api'
import { SpecificationDialog } from './SpecificationDialog'
import type { ConnectionSpecification } from './types'

type SpecificationsPanelProps = {
  /** The chosen variant; null — none yet. */
  typeId: number | null
  selectedId: number | null
  onSelect: (id: number) => void
  /** A row was deleted (the page drops it if it was chosen). */
  onDeleted: (id: number) => void
}

/** The chosen variant's products (the old ConnectionTypeSpecification). */
export function SpecificationsPanel({ typeId, ...props }: SpecificationsPanelProps) {
  const { t } = useTranslation()
  if (typeId === null)
    return (
      <Panel
        title={t('connection.spec.title')}
        actions={
          <Button size="sm" icon={<Plus size={16} />} disabled>
            {t('common.add')}
          </Button>
        }
      >
        <p className="px-4 py-10 text-center text-muted">{t('connection.spec.pick_type')}</p>
      </Panel>
    )
  // Mounted per variant: a dialog opened for one can't save under another.
  return <SpecificationsTable key={typeId} typeId={typeId} {...props} />
}

function SpecificationsTable({
  typeId,
  selectedId,
  onSelect,
  onDeleted,
}: SpecificationsPanelProps & { typeId: number }) {
  const { t } = useTranslation()
  // null — closed; 'new' — adding; otherwise the row's id.
  const [dialog, setDialog] = useState<string | null>(null)

  const table = useServerTable<ConnectionSpecification>({
    key: 'specs',
    queryKey: connectionKeys.specs,
    fetchPage: connectionApi.specs,
    filter: { connectionTypeId: typeId },
    defaultSize: 10,
  })

  const del = useConfirmDelete<ConnectionSpecification>({
    remove: (row) => connectionApi.removeSpec(row.id),
    invalidate: connectionKeys.specs,
    onDeleted: (row) => onDeleted(row.id),
    getName: (row) => [row.article, row.productName].filter(Boolean).join(' — '),
  })

  // Sort names are the old headerTable's: color, product_name, supplier_name.
  const columns: Column<ConnectionSpecification>[] = [
    { key: 'textureName', sortKey: 'color', title: t('connection.spec.texture'), sortable: true },
    { key: 'article', title: t('connection.spec.article'), sortable: true },
    {
      key: 'productName',
      sortKey: 'product_name',
      title: t('connection.spec.product'),
      sortable: true,
    },
    {
      key: 'supplierName',
      sortKey: 'supplier_name',
      title: t('connection.spec.supplier'),
      sortable: true,
    },
  ]

  return (
    <Panel
      title={t('connection.spec.title')}
      actions={
        <Button size="sm" icon={<Plus size={16} />} onClick={() => setDialog('new')}>
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
        empty={t('connection.spec.empty')}
        selectedKey={selectedId}
        onRowClick={(row) => onSelect(row.id)}
        skeletonRows={3}
        actions={(row) => (
          <>
            <IconButton label={t('common.edit')} onClick={() => setDialog(String(row.id))}>
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
      {dialog !== null && (
        <SpecificationDialog
          typeId={typeId}
          id={dialog === 'new' ? undefined : dialog}
          onClose={() => setDialog(null)}
        />
      )}
    </Panel>
  )
}
