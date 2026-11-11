import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useConfirmDelete } from '@/shared/hooks/useConfirmDelete'
import type { useServerTable } from '@/shared/hooks/useServerTable'
import { useSuppliers } from '@/shared/lookups/suppliers'
import {
  Button,
  Combobox,
  DataTable,
  IconButton,
  Pagination,
  SearchInput,
  TableToolbar,
  type Column,
} from '@/shared/ui'
import { specificationApi, specificationKeys } from './api'
import { SpecificationDialog } from './SpecificationDialog'
import type { SpecificationRow } from './types'

type SpecificationTabProps = {
  systemId: number
  /** Owned by the page: the tab's count comes from it too. */
  table: ReturnType<typeof useServerTable<SpecificationRow>>
  supplierId: number | null
  onSupplierChange: (supplierId: number | null) => void
}

/** The system's profiles (the old «Спецификация профиле системы»). */
export function SpecificationTab({
  systemId,
  table,
  supplierId,
  onSupplierChange,
}: SpecificationTabProps) {
  const { t } = useTranslation()
  const suppliers = useSuppliers()
  // null — closed; 'new' — adding; otherwise the row's id.
  const [dialog, setDialog] = useState<string | null>(null)

  const del = useConfirmDelete<SpecificationRow>({
    remove: (row) => specificationApi.remove(row.id),
    invalidate: specificationKeys.all,
    getName: (row) => [row.article, row.name].filter(Boolean).join(' — '),
  })

  // Sort names are the old headerTable's: application and sideways, not the fields.
  const columns: Column<SpecificationRow>[] = [
    {
      key: 'priority',
      title: t('profileSystems.spec.priority'),
      sortable: true,
      render: (row) => <span className="tabular-nums">{row.priority}</span>,
    },
    { key: 'article', title: t('profileSystems.spec.article'), sortable: true },
    { key: 'name', title: t('profileSystems.spec.name'), sortable: true },
    {
      key: 'applicationType',
      sortKey: 'application',
      title: t('profileSystems.spec.application'),
      sortable: true,
      render: (row) => (row.applicationType ? t(row.applicationType) : ''),
    },
    {
      key: 'sideType',
      sortKey: 'sideways',
      title: t('profileSystems.spec.side'),
      sortable: true,
      render: (row) => (row.sideType ? t(row.sideType) : ''),
    },
  ]

  return (
    <>
      <TableToolbar>
        <SearchInput
          value={table.search}
          onChange={table.onSearchChange}
          placeholder={t('profileSystems.spec.search')}
          className="w-full sm:w-64"
        />
        <div className="w-full sm:w-56">
          <Combobox
            aria-label={t('profileSystems.spec.supplier')}
            placeholder={t('profileSystems.spec.all_suppliers')}
            options={suppliers.data ?? []}
            value={suppliers.data?.find((s) => s.id === supplierId) ?? null}
            onChange={(s) => onSupplierChange(s?.id ?? null)}
            getKey={(s) => s.id}
            getLabel={(s) => t(s.name)}
            loading={suppliers.isPending}
            clearable
          />
        </div>
        <Button className="sm:ml-auto" icon={<Plus size={16} />} onClick={() => setDialog('new')}>
          {t('profileSystems.spec.add')}
        </Button>
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
        empty={t('profileSystems.spec.empty')}
        highlight={table.search}
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
          systemId={systemId}
          id={dialog === 'new' ? undefined : dialog}
          supplierId={supplierId}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  )
}
