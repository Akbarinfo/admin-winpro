import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Outlet, useNavigate } from 'react-router'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useConfirmDelete } from '@/shared/hooks/useConfirmDelete'
import {
  Alert,
  Button,
  Chip,
  DataTable,
  IconButton,
  ListLayout,
  PageHeader,
  TableCard,
  type Column,
} from '@/shared/ui'
import { akfaApi, akfaKeys } from './api'
import type { AkfaUnitMapping } from './types'
import { unitMappingsQuery } from './unitMappingsQuery'

const unitLabel = (m: AkfaUnitMapping) =>
  m.unitShortName ? `${m.unitName ?? ''} (${m.unitShortName})` : (m.unitName ?? '')

/** Akfa dealer units ↔ WinPro units (the old AkfaUnitMappingLayout): a short list, no paging. */
export function UnitMappingListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const list = useQuery(unitMappingsQuery)

  const del = useConfirmDelete<AkfaUnitMapping>({
    remove: (row) => akfaApi.removeUnitMapping(row.id),
    invalidate: akfaKeys.units,
    getName: (row) => `${row.akfaUnitName} → ${row.unitName || '—'}`,
  })

  const unmapped = (list.data ?? []).filter((m) => !m.unitId).length

  const columns: Column<AkfaUnitMapping>[] = [
    {
      key: 'akfaUnitId',
      title: t('akfa.units.col_akfa_id'),
      className: 'w-28 tabular-nums',
    },
    {
      key: 'akfaUnitName',
      title: t('akfa.units.col_akfa_name'),
      render: (row) => <span className="font-medium">{row.akfaUnitName}</span>,
    },
    {
      key: 'unitName',
      title: t('akfa.units.col_winpro_unit'),
      render: (row) =>
        row.unitId ? unitLabel(row) : <Chip tone="warn">{t('akfa.units.not_selected')}</Chip>,
    },
  ]

  return (
    <ListLayout>
      <PageHeader
        title={t('akfa.units.title')}
        description={t('akfa.units.description')}
        actions={
          <Button icon={<Plus size={16} />} onClick={() => navigate('add')}>
            {t('akfa.units.add')}
          </Button>
        }
      />

      {unmapped > 0 && (
        <div className="mb-4">
          <Alert tone="warn">{t('akfa.units.unmapped_warning', { count: unmapped })}</Alert>
        </div>
      )}

      <TableCard>
        <DataTable
          columns={columns}
          rows={list.data ?? []}
          getRowKey={(row) => row.id}
          loading={list.isPending}
          fetching={list.isFetching}
          error={list.error}
          onRetry={() => list.refetch()}
          empty={t('akfa.units.empty')}
          actions={(row) => (
            <>
              <IconButton label={t('common.edit')} onClick={() => navigate(`update/${row.id}`)}>
                <Pencil size={16} />
              </IconButton>
              <IconButton
                label={t('akfa.units.delete')}
                tone="danger"
                onClick={() => del.request(row)}
              >
                <Trash2 size={16} />
              </IconButton>
            </>
          )}
        />
      </TableCard>

      {del.dialog}
      {/* add / update/:id render the form dialog over the list */}
      <Outlet />
    </ListLayout>
  )
}
