import { useQuery } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useConfirmDelete } from '@/shared/hooks/useConfirmDelete'
import type { TableSort } from '@/shared/api/table'
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
  ) : props.endpoint.list ? (
    <ParameterList key={parentId} parentId={parentId} {...props} />
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

type OwnerProps = Omit<ParameterPanelProps, 'parentId' | 'hint'> & { parentId: number }

/** Paged and sorted on the server: POST `${base}/table`. */
function ParameterTable({ title, endpoint, parentId, tableKey }: OwnerProps) {
  const table = useServerTable<ParameterRow>({
    key: tableKey,
    queryKey: parameterKeys.of(endpoint.base),
    fetchPage: (body, signal) => parameterApi.table(endpoint.base, body, signal),
    filter: { [endpoint.filterField]: parentId },
    defaultSize: 10,
  })

  return (
    <ParameterView
      title={title}
      endpoint={endpoint}
      parentId={parentId}
      rows={table.rows}
      loading={table.isLoading}
      fetching={table.isFetching}
      error={table.error}
      onRetry={() => table.refetch()}
      sort={{ value: table.sort, onChange: table.onSortChange }}
      footer={<Pagination {...table.pagination} />}
    />
  )
}

/** All at once: a plain GET list (endpoint.list). */
function ParameterList({ title, endpoint, parentId }: OwnerProps) {
  const url = endpoint.list!(parentId)
  const list = useQuery({
    queryKey: [...parameterKeys.of(endpoint.base), 'list', parentId],
    queryFn: ({ signal }) => parameterApi.list(url, signal),
  })

  return (
    <ParameterView
      title={title}
      endpoint={endpoint}
      parentId={parentId}
      rows={list.data ?? []}
      loading={list.isPending}
      fetching={list.isFetching}
      error={list.error}
      onRetry={() => list.refetch()}
    />
  )
}

type ParameterViewProps = {
  title: ReactNode
  endpoint: ParameterEndpoint
  parentId: number
  rows: ParameterRow[]
  loading: boolean
  fetching: boolean
  error: unknown
  onRetry: () => void
  /** Only a server table sorts. */
  sort?: { value: TableSort | undefined; onChange: (sort: TableSort) => void }
  footer?: ReactNode
}

function ParameterView({
  title,
  endpoint,
  parentId,
  rows,
  loading,
  fetching,
  error,
  onRetry,
  sort,
  footer,
}: ParameterViewProps) {
  const { t } = useTranslation()
  const { base, kindField, translateValue } = endpoint
  // null — closed; 'new' — adding; otherwise the row's id.
  const [dialog, setDialog] = useState<string | null>(null)

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
      sortable: !!sort,
      render: kindOf,
    },
    {
      key: 'value',
      title: t('parameters.value'),
      sortable: !!sort,
      render: (row) => (row.value && translateValue ? t(row.value) : (row.value ?? '')),
    },
  ]

  return (
    <PanelFrame title={title} onAdd={() => setDialog('new')}>
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        loading={loading}
        fetching={fetching}
        sort={sort?.value}
        onSortChange={sort?.onChange}
        error={error}
        onRetry={onRetry}
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
      {footer}

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
