import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Outlet, useNavigate } from 'react-router'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useConfirmDelete } from '@/shared/hooks/useConfirmDelete'
import {
  Button,
  Chip,
  DataTable,
  IconButton,
  ListLayout,
  PageHeader,
  TableCard,
  type Column,
} from '@/shared/ui'
import { tariffFeatureApi, tariffFeatureKeys } from './api'
import type { TariffFeature } from './types'

/** Loaded whole from /list, no paging or sorting — as in the old panel. */
export function TariffFeatureListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const list = useQuery({
    queryKey: [...tariffFeatureKeys.all, 'list'],
    queryFn: ({ signal }) => tariffFeatureApi.list(signal),
  })

  const del = useConfirmDelete<TariffFeature>({
    remove: (row) => tariffFeatureApi.remove(row.id),
    invalidate: tariffFeatureKeys.all,
    getName: (row) => `${row.tariff} · ${row.featureLabel || row.featureKey}`,
  })

  const dash = (v?: string | null) => v || '—'
  const columns: Column<TariffFeature>[] = [
    { key: 'id', title: 'ID', className: 'w-14 text-faint tabular-nums' },
    {
      key: 'tariff',
      title: t('tariffFeature.tariff'),
      render: (row) => <Chip tone="primary">{row.tariff}</Chip>,
    },
    { key: 'featureKey', title: t('tariffFeature.feature_key'), className: 'text-muted' },
    {
      key: 'featureLabel',
      title: t('tariffFeature.feature_label'),
      render: (row) => dash(row.featureLabel),
    },
    { key: 'value', title: t('tariffFeature.value'), className: 'font-medium' },
    {
      key: 'featureType',
      title: t('tariffFeature.feature_type'),
      render: (row) => <Chip>{row.featureType}</Chip>,
    },
    { key: 'unit', title: t('tariffFeature.unit'), render: (row) => dash(row.unit) },
    {
      key: 'sortOrder',
      title: t('tariffFeature.sort_order'),
      align: 'right',
      className: 'tabular-nums',
    },
  ]

  return (
    <ListLayout>
      <PageHeader
        title={t('tariffFeature.title')}
        actions={
          <Button icon={<Plus size={16} />} onClick={() => navigate('add')}>
            {t('tariffFeature.add')}
          </Button>
        }
      />

      <TableCard>
        <DataTable
          columns={columns}
          rows={list.data ?? []}
          getRowKey={(row) => row.id}
          loading={list.isPending}
          fetching={list.isFetching}
          error={list.error}
          onRetry={() => list.refetch()}
          empty={t('tariffFeature.empty')}
          actions={(row) => (
            <>
              <IconButton label={t('common.edit')} onClick={() => navigate(`update/${row.id}`)}>
                <Pencil size={16} />
              </IconButton>
              <IconButton label={t('common.delete')} tone="danger" onClick={() => del.request(row)}>
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
