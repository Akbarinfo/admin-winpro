import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
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
  Thumbnail,
  type Column,
} from '@/shared/ui'
import { countryApi, countryKeys } from './api'
import type { CountryRecord } from './types'

/** A short list without a /table endpoint: loaded whole, no paging or sorting (as in the old panel). */
export function CountryListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const list = useQuery({
    queryKey: [...countryKeys.all, 'list'],
    queryFn: ({ signal }) => countryApi.list(signal),
  })

  const del = useConfirmDelete<CountryRecord>({
    remove: (row) => countryApi.remove(row.id),
    invalidate: countryKeys.all,
    getName: (row) => row.name,
  })

  const columns: Column<CountryRecord>[] = [
    {
      key: 'flag',
      title: <span className="sr-only">{t('countries.flag')}</span>,
      className: 'w-12',
      render: (row) => <Thumbnail src={row.flagUrl ?? undefined} />,
    },
    { key: 'name', title: t('countries.name'), className: 'font-medium' },
    {
      key: 'code',
      title: t('countries.code'),
      render: (row) => <Chip>{row.code}</Chip>,
    },
    {
      key: 'phoneCode',
      title: t('countries.phone_code'),
      className: 'tabular-nums',
      render: (row) => row.phoneCode || '—',
    },
    {
      key: 'currency',
      title: t('countries.currency'),
      render: (row) => row.currencyName || row.currency?.name || '—',
    },
    {
      key: 'storageBucket',
      title: t('countries.bucket_column'),
      render: (row) =>
        row.storageBucket ? (
          <Chip tone="primary">{row.storageBucket}</Chip>
        ) : (
          <span className="text-faint">{t('countries.bucket_shared')}</span>
        ),
    },
    {
      key: 'status',
      title: t('countries.is_active'),
      render: (row) => (
        <span className="flex flex-wrap gap-1">
          {row.isActive ? (
            <Chip tone="ok">{t('countries.is_active')}</Chip>
          ) : (
            <Chip>{t('countries.inactive')}</Chip>
          )}
          {row.isDefault && <Chip tone="primary">{t('countries.is_default')}</Chip>}
        </span>
      ),
    },
  ]

  return (
    <ListLayout>
      <PageHeader
        title={t('countries.title')}
        actions={
          <Button icon={<Plus size={16} />} onClick={() => navigate('add')}>
            {t('countries.add')}
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
          empty={t('countries.empty')}
          onRowClick={(row) => navigate(`update/${row.id}`)}
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
    </ListLayout>
  )
}
