import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Copy, CopyPlus, Pencil, Plus, Trash2 } from 'lucide-react'
import { useConfirmCopy } from '@/shared/hooks/useConfirmCopy'
import { useConfirmDelete } from '@/shared/hooks/useConfirmDelete'
import { useServerTable } from '@/shared/hooks/useServerTable'
import { Button, Chip, DataTable, IconButton, Pagination, Panel, type Column } from '@/shared/ui'
import { AdditionalDialog } from './AdditionalDialog'
import { insertApi, insertKeys } from './api'
import { CopyToProductDialog } from './CopyToProductDialog'
import type { Additional } from './types'

type AdditionalPanelProps = {
  consistId: string
  selectedId: number | null
  onSelect: (id: number) => void
  /** A row was deleted (the page drops it if it was chosen). */
  onDeleted: (id: number) => void
}

/** The product's inserts (the old Inserts panel). */
export function AdditionalPanel({
  consistId,
  selectedId,
  onSelect,
  onDeleted,
}: AdditionalPanelProps) {
  const { t } = useTranslation()
  // null — closed; 'new' — adding; otherwise the row's id.
  const [dialog, setDialog] = useState<string | null>(null)
  const [copyTo, setCopyTo] = useState<Additional | null>(null)

  const table = useServerTable<Additional>({
    key: 'add',
    queryKey: insertKeys.additional,
    fetchPage: insertApi.additional,
    filter: { consistId },
    defaultSize: 10,
  })

  const del = useConfirmDelete<Additional>({
    remove: (row) => insertApi.removeAdditional(row.id),
    invalidate: insertKeys.additional,
    onDeleted: (row) => onDeleted(row.id),
    getName: (row) => row.name ?? '',
  })
  const copy = useConfirmCopy<Additional>({
    copy: (row) => insertApi.copyAdditional(row.id),
    invalidate: insertKeys.additional,
    getName: (row) => row.name ?? '',
  })

  const columns: Column<Additional>[] = [
    { key: 'name', title: t('inserts.additional.name'), sortable: true },
    {
      key: 'byDefault',
      title: t('inserts.additional.default'),
      render: (row) =>
        row.byDefault && <Chip tone="primary">{t('inserts.additional.default')}</Chip>,
    },
    {
      key: 'necessarily',
      title: t('inserts.additional.necessarily'),
      render: (row) =>
        row.necessarily && <Chip tone="warn">{t('inserts.additional.necessarily')}</Chip>,
    },
  ]

  return (
    <Panel
      title={t('inserts.additional.title')}
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
        empty={t('inserts.additional.empty')}
        selectedKey={selectedId}
        onRowClick={(row) => onSelect(row.id)}
        skeletonRows={3}
        actions={(row) => (
          <>
            <IconButton label={t('common.copy')} onClick={() => copy.request(row)}>
              <Copy size={16} />
            </IconButton>
            <IconButton
              label={t('inserts.additional.copy_to_product')}
              onClick={() => setCopyTo(row)}
            >
              <CopyPlus size={16} />
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
        <AdditionalDialog
          consistId={consistId}
          id={dialog === 'new' ? undefined : dialog}
          onClose={() => setDialog(null)}
        />
      )}
      {copyTo && <CopyToProductDialog additional={copyTo} onClose={() => setCopyTo(null)} />}
    </Panel>
  )
}
