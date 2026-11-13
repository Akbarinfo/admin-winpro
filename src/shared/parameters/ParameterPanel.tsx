import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useConfirmDelete } from '@/shared/hooks/useConfirmDelete'
import { useServerTable } from '@/shared/hooks/useServerTable'
import { Button, DataTable, IconButton, Pagination, Panel, type Column } from '@/shared/ui'
import { parameterApi, parameterKeys, type ParameterEndpoint, type ParameterRow } from './api'
import { ParameterDialog } from './ParameterDialog'

type ParameterPanelProps = {
  title: ReactNode
  endpoint: ParameterEndpoint
  /** The owner whose parameters are shown; null — nothing chosen yet. */
  parentId: number | null
  /** URL prefix of this table's params (several tables share a page). */
  tableKey: string
  /** Shown while nothing is chosen. */
  hint: ReactNode
}

/** An owner's parameters: list, add, edit, delete (the old *Parameter panels). */
export function ParameterPanel({ parentId, ...props }: ParameterPanelProps) {
  // Mounting per owner keeps one owner's dialog from saving under another.
  return parentId === null ? (
    <PanelFrame title={props.title} disabled>
      <p className="px-4 py-10 text-center text-muted">{props.hint}</p>
    </PanelFrame>
  ) : (
    <ParameterTable key={parentId} parentId={parentId} {...props} />
  )
}

function PanelFrame({
  title,
  disabled,
  onAdd,
  children,
}: {
  title: ReactNode
  disabled?: boolean
  onAdd?: () => void
  children: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <Panel
      title={title}
      actions={
        <Button size="sm" icon={<Plus size={16} />} disabled={disabled} onClick={onAdd}>
          {t('common.add')}
        </Button>
      }
    >
      {children}
    </Panel>
  )
}

function ParameterTable({
  title,
  endpoint,
  parentId,
  tableKey,
}: Omit<ParameterPanelProps, 'parentId' | 'hint'> & { parentId: number }) {
  const { t } = useTranslation()
  const { base, kindField, filterField, translateValue } = endpoint
  // null — closed; 'new' — adding; otherwise the row's id.
  const [dialog, setDialog] = useState<string | null>(null)

  const table = useServerTable<ParameterRow>({
    key: tableKey,
    queryKey: parameterKeys.of(base),
    fetchPage: (body, signal) => parameterApi.table(base, body, signal),
    filter: { [filterField]: parentId },
    defaultSize: 10,
  })

  const kindOf = (row: ParameterRow) =>
    typeof row[kindField] === 'string' ? t(row[kindField] as string) : ''

  const del = useConfirmDelete<ParameterRow>({
    remove: (row) => parameterApi.remove(base, row.id),
    invalidate: parameterKeys.of(base),
    getName: (row) => [kindOf(row), row.value].filter(Boolean).join(': '),
  })

  // Sort names are the old headerTable's: «name» for the kind.
  const columns: Column<ParameterRow>[] = [
    {
      key: kindField,
      sortKey: 'name',
      title: t('parameters.parameter'),
      sortable: true,
      render: kindOf,
    },
    {
      key: 'value',
      title: t('parameters.value'),
      sortable: true,
      render: (row) => (row.value && translateValue ? t(row.value) : (row.value ?? '')),
    },
  ]

  return (
    <PanelFrame title={title} onAdd={() => setDialog('new')}>
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
        empty={t('parameters.empty')}
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
        <ParameterDialog
          endpoint={endpoint}
          parentId={parentId}
          id={dialog === 'new' ? undefined : dialog}
          onClose={() => setDialog(null)}
        />
      )}
    </PanelFrame>
  )
}
