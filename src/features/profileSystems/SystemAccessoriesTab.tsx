import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { useConfirmDelete } from '@/shared/hooks/useConfirmDelete'
import type { useServerTable } from '@/shared/hooks/useServerTable'
import {
  Button,
  DataTable,
  IconButton,
  Pagination,
  SearchInput,
  TableToolbar,
  type Column,
} from '@/shared/ui'
import { systemAccessoryApi, systemAccessoryKeys } from './api'
import { SystemAccessoryDialog } from './SystemAccessoryDialog'
import type { SystemAccessoryRow } from './types'

type SystemAccessoriesTabProps = {
  systemId: number
  /** Owned by the page: the tab's count comes from it too. */
  table: ReturnType<typeof useServerTable<SystemAccessoryRow>>
}

/** The system's accessories (the old «Фурнитуры профиле системы»). */
export function SystemAccessoriesTab({ systemId, table }: SystemAccessoriesTabProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  // null — closed; 'new' — adding; otherwise the row's id.
  const [dialog, setDialog] = useState<string | null>(null)

  const del = useConfirmDelete<SystemAccessoryRow>({
    remove: (row) => systemAccessoryApi.remove(row.id),
    invalidate: systemAccessoryKeys.all,
    getName: (row) => row.accessoryName ?? '',
  })

  const up = useMutation({
    mutationFn: (row: SystemAccessoryRow) => systemAccessoryApi.up(row.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: systemAccessoryKeys.all }),
  })

  const columns: Column<SystemAccessoryRow>[] = [
    { key: 'accessoryName', title: t('profileSystems.acc.name'), sortable: true },
    {
      key: 'openingType',
      title: t('profileSystems.acc.opening'),
      sortable: true,
      render: (row) => (row.openingType ? t(row.openingType) : ''),
    },
    {
      key: 'handleType',
      title: t('profileSystems.acc.handle'),
      sortable: true,
      render: (row) => (row.handleType ? t(row.handleType) : ''),
    },
  ]

  return (
    <>
      <TableToolbar>
        <SearchInput
          value={table.search}
          onChange={table.onSearchChange}
          placeholder={t('profileSystems.acc.search')}
          className="w-full sm:w-64"
        />
        <Button className="sm:ml-auto" icon={<Plus size={16} />} onClick={() => setDialog('new')}>
          {t('profileSystems.acc.add')}
        </Button>
      </TableToolbar>

      <DataTable
        columns={columns}
        rows={table.rows}
        getRowKey={(row) => row.id}
        loading={table.isLoading}
        fetching={table.isFetching || up.isPending}
        sort={table.sort}
        onSortChange={table.onSortChange}
        error={table.error}
        onRetry={() => table.refetch()}
        empty={t('profileSystems.acc.empty')}
        highlight={table.search}
        actions={(row) => (
          <>
            <IconButton
              label={t('profileSystems.acc.up')}
              disabled={up.isPending}
              onClick={() => up.mutate(row)}
            >
              <ArrowUp size={16} />
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
      {dialog !== null && (
        <SystemAccessoryDialog
          systemId={systemId}
          id={dialog === 'new' ? undefined : dialog}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  )
}
