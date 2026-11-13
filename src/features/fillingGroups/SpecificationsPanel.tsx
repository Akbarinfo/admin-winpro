import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useConfirmDelete } from '@/shared/hooks/useConfirmDelete'
import { useServerTable } from '@/shared/hooks/useServerTable'
import { formatNumber } from '@/shared/lib/format'
import { Button, DataTable, IconButton, Pagination, Panel, type Column } from '@/shared/ui'
import { fillingApi, fillingKeys } from './api'
import { SpecificationDialog } from './SpecificationDialog'
import type { FillingSpecification } from './types'

type SpecificationsPanelProps = {
  groupId: string
  selectedId: number | null
  onSelect: (id: number) => void
  /** A row was deleted (the page drops it if it was chosen). */
  onDeleted: (id: number) => void
}

/** The group's products (the old FillingSpecification). */
export function SpecificationsPanel({
  groupId,
  selectedId,
  onSelect,
  onDeleted,
}: SpecificationsPanelProps) {
  const { t } = useTranslation()
  // null — closed; 'new' — adding; otherwise the row's id.
  const [dialog, setDialog] = useState<string | null>(null)

  const table = useServerTable<FillingSpecification>({
    key: 'specs',
    queryKey: fillingKeys.specs,
    fetchPage: fillingApi.specs,
    filter: { fillingGroupId: groupId },
    defaultSize: 10,
  })

  const del = useConfirmDelete<FillingSpecification>({
    remove: (row) => fillingApi.removeSpec(row.id),
    invalidate: fillingKeys.specs,
    onDeleted: (row) => onDeleted(row.id),
    getName: (row) => [row.article, row.productName].filter(Boolean).join(' — '),
  })

  // Sort names are the old headerTable's: color, product_name, supplier_name; thickness wasn't sortable.
  const columns: Column<FillingSpecification>[] = [
    {
      key: 'thickness',
      title: t('fillingGroups.spec.thickness'),
      align: 'right',
      render: (row) => <span className="tabular-nums">{formatNumber(row.thickness)}</span>,
    },
    {
      key: 'textureName',
      sortKey: 'color',
      title: t('fillingGroups.spec.texture'),
      sortable: true,
    },
    {
      key: 'productName',
      sortKey: 'product_name',
      title: t('fillingGroups.spec.product'),
      sortable: true,
    },
    {
      key: 'supplierName',
      sortKey: 'supplier_name',
      title: t('fillingGroups.spec.supplier'),
      sortable: true,
    },
    { key: 'article', title: t('fillingGroups.spec.article'), sortable: true },
  ]

  return (
    <Panel
      title={t('fillingGroups.spec.title')}
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
        empty={t('fillingGroups.spec.empty')}
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
          groupId={groupId}
          id={dialog === 'new' ? undefined : dialog}
          onClose={() => setDialog(null)}
        />
      )}
    </Panel>
  )
}
