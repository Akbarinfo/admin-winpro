import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Outlet, useNavigate } from 'react-router'
import { Pencil, Plus } from 'lucide-react'
import { formatDateTime } from '@/shared/lib/format'
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
import { appVersionApi, appVersionKeys } from './api'
import type { AppVersion } from './types'

/** One row per platform, loaded whole. No delete — the old panel had none. */
export function AppVersionListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const list = useQuery({
    queryKey: [...appVersionKeys.all, 'list'],
    queryFn: ({ signal }) => appVersionApi.list(signal),
  })

  const columns: Column<AppVersion>[] = [
    {
      key: 'platform',
      title: t('appVersions.platform'),
      className: 'font-medium',
    },
    {
      key: 'latestVersion',
      title: t('appVersions.latest_version'),
      className: 'tabular-nums',
      render: (row) => row.latestVersion || '—',
    },
    {
      key: 'minVersion',
      title: t('appVersions.min_version'),
      className: 'tabular-nums',
      render: (row) => row.minVersion || '—',
    },
    {
      key: 'forceUpdate',
      title: t('appVersions.force_update'),
      render: (row) =>
        row.forceUpdate ? <Chip tone="warn">{t('appVersions.force_update')}</Chip> : '—',
    },
    {
      key: 'updatedAt',
      title: t('appVersions.updated_at'),
      className: 'text-muted tabular-nums',
      render: (row) => formatDateTime(row.updatedAt) || '—',
    },
  ]

  return (
    <ListLayout>
      <PageHeader
        title={t('appVersions.title')}
        actions={
          <Button icon={<Plus size={16} />} onClick={() => navigate('add')}>
            {t('appVersions.add')}
          </Button>
        }
      />

      <TableCard>
        <DataTable
          columns={columns}
          rows={list.data ?? []}
          getRowKey={(row) => row.platform}
          loading={list.isPending}
          fetching={list.isFetching}
          error={list.error}
          onRetry={() => list.refetch()}
          empty={t('appVersions.empty')}
          actions={(row) => (
            <IconButton
              label={t('common.edit')}
              onClick={() => navigate(`update/${encodeURIComponent(row.platform)}`)}
            >
              <Pencil size={16} />
            </IconButton>
          )}
        />
      </TableCard>

      {/* add / update/:platform render the form dialog over the list */}
      <Outlet />
    </ListLayout>
  )
}
