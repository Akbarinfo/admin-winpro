import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Copy, Pencil, Plus, Trash2 } from 'lucide-react'
import { useConfirmCopy } from '@/shared/hooks/useConfirmCopy'
import { useConfirmDelete } from '@/shared/hooks/useConfirmDelete'
import { useServerTable } from '@/shared/hooks/useServerTable'
import { Button, DataTable, IconButton, Pagination, Panel, type Column } from '@/shared/ui'
import { insertApi, insertKeys } from './api'
import { SpecificationDialog } from './SpecificationDialog'
import type { AdditionalSpecification } from './types'

type SpecificationsPanelProps = {
  /** The chosen insert; null — none yet. */
  additionalId: number | null
  selectedId: number | null
  onSelect: (id: number) => void
  /** A row was deleted (the page drops it if it was chosen). */
  onDeleted: (id: number) => void
}

/** The chosen insert's products (the old InsertsSpecification). */
export function SpecificationsPanel({ additionalId, ...props }: SpecificationsPanelProps) {
  const { t } = useTranslation()
  if (additionalId === null)
    return (
      <Panel
        title={t('inserts.spec.title')}
        actions={
          <Button size="sm" icon={<Plus size={16} />} disabled>
            {t('common.add')}
          </Button>
        }
      >
        <p className="px-4 py-10 text-center text-muted">{t('inserts.pick_additional')}</p>
      </Panel>
    )
  // Mounted per insert: a dialog opened for one can't save under another.
  return <SpecificationsTable key={additionalId} additionalId={additionalId} {...props} />
}

function SpecificationsTable({
  additionalId,
  selectedId,
  onSelect,
  onDeleted,
}: SpecificationsPanelProps & { additionalId: number }) {
  const { t } = useTranslation()
  // null — closed; 'new' — adding; otherwise the row's id.
  const [dialog, setDialog] = useState<string | null>(null)

  const table = useServerTable<AdditionalSpecification>({
    key: 'specs',
    queryKey: insertKeys.specs,
    fetchPage: insertApi.specs,
    filter: { additionalId },
    defaultSize: 10,
  })

  const del = useConfirmDelete<AdditionalSpecification>({
    remove: (row) => insertApi.removeSpec(row.id),
    invalidate: insertKeys.specs,
    onDeleted: (row) => onDeleted(row.id),
    getName: (row) => [row.article, row.productName].filter(Boolean).join(' — '),
  })

  const copy = useConfirmCopy<AdditionalSpecification>({
    copy: (row) => insertApi.copySpec(row.id),
    invalidate: insertKeys.specs,
    getName: (row) => [row.article, row.productName].filter(Boolean).join(' — '),
  })

  // Sort names are the old headerTable's: color, product_name, supplier_name.
  const columns: Column<AdditionalSpecification>[] = [
    { key: 'textureName', sortKey: 'color', title: t('inserts.spec.texture'), sortable: true },
    { key: 'article', title: t('inserts.spec.article'), sortable: true },
    {
      key: 'productName',
      sortKey: 'product_name',
      title: t('inserts.spec.product'),
      sortable: true,
    },
    {
      key: 'supplierName',
      sortKey: 'supplier_name',
      title: t('inserts.spec.supplier'),
      sortable: true,
    },
  ]

  return (
    <Panel
      title={t('inserts.spec.title')}
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
        empty={t('inserts.spec.empty')}
        selectedKey={selectedId}
        onRowClick={(row) => onSelect(row.id)}
        skeletonRows={3}
        actions={(row) => (
          <>
            <IconButton label={t('common.copy')} onClick={() => copy.request(row)}>
              <Copy size={16} />
            </IconButton>
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
      {copy.dialog}
      {dialog !== null && (
        <SpecificationDialog
          additionalId={additionalId}
          id={dialog === 'new' ? undefined : dialog}
          onClose={() => setDialog(null)}
        />
      )}
    </Panel>
  )
}
