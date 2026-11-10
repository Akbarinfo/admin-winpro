import { useQuery } from '@tanstack/react-query'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useConfirmDelete } from '@/shared/hooks/useConfirmDelete'
import { Button, Card, Chip, DataTable, IconButton, type Column } from '@/shared/ui'
import { providerApi, providerKeys } from './api'
import { ProviderDialog } from './ProviderDialog'
import type { CountryProvider } from './types'

/** How a country's users get codes — SMS, Telegram… in order. Only for a saved country. */
export function CountryProviders({ countryId }: { countryId: string }) {
  const { t } = useTranslation()
  const headingId = useId()
  // null — closed; 'new' — adding; a provider — editing it.
  const [editing, setEditing] = useState<CountryProvider | 'new' | null>(null)

  const providers = useQuery({
    queryKey: providerKeys.of(countryId),
    queryFn: ({ signal }) => providerApi.list(countryId, signal),
  })

  const del = useConfirmDelete<CountryProvider>({
    remove: (row) => providerApi.remove(row.id),
    invalidate: providerKeys.of(countryId),
    getName: (row) => row.provider,
  })

  const columns: Column<CountryProvider>[] = [
    { key: 'provider', title: t('countries.providers.provider'), className: 'font-medium' },
    {
      key: 'sortOrder',
      title: t('countries.providers.sort_order'),
      className: 'tabular-nums',
    },
    {
      key: 'isActive',
      title: t('countries.providers.is_active'),
      render: (row) =>
        row.isActive ? (
          <Chip tone="ok">{t('countries.providers.is_active')}</Chip>
        ) : (
          <Chip>{t('countries.providers.inactive')}</Chip>
        ),
    },
  ]

  return (
    <Card role="region" aria-labelledby={headingId} className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line py-2 pr-2 pl-4">
        <h2 id={headingId} className="font-semibold">
          {t('countries.providers.title')}
          {providers.data && (
            <span className="font-medium text-faint"> · {providers.data.length}</span>
          )}
        </h2>
        <Button size="sm" icon={<Plus size={14} />} onClick={() => setEditing('new')}>
          {t('countries.providers.add')}
        </Button>
      </div>
      <DataTable
        columns={columns}
        rows={providers.data ?? []}
        getRowKey={(row) => row.id}
        loading={providers.isPending}
        fetching={providers.isFetching}
        error={providers.error}
        onRetry={() => providers.refetch()}
        empty={t('countries.providers.empty')}
        skeletonRows={2}
        actions={(row) => (
          <>
            <IconButton label={t('common.edit')} onClick={() => setEditing(row)}>
              <Pencil size={16} />
            </IconButton>
            <IconButton label={t('common.delete')} tone="danger" onClick={() => del.request(row)}>
              <Trash2 size={16} />
            </IconButton>
          </>
        )}
      />
      {del.dialog}
      {editing !== null && (
        <ProviderDialog
          countryId={countryId}
          provider={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </Card>
  )
}
