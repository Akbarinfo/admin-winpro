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
import { languageApi, languageKeys } from './api'
import type { Language } from './types'

/** A short list without a /table endpoint: loaded whole, no paging or sorting (as in the old panel). */
export function LanguageListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const list = useQuery({
    queryKey: [...languageKeys.all, 'list'],
    queryFn: ({ signal }) => languageApi.list(signal),
  })

  const del = useConfirmDelete<Language>({
    remove: (row) => languageApi.remove(row.code),
    invalidate: languageKeys.all,
    getName: (row) => `${row.name} (${row.code})`,
  })

  const columns: Column<Language>[] = [
    {
      key: 'code',
      title: t('languages.code'),
      className: 'w-24',
      render: (row) => <Chip>{row.code}</Chip>,
    },
    { key: 'name', title: t('languages.name') },
    {
      key: 'default',
      title: t('languages.default'),
      render: (row) => row.default && <Chip tone="primary">{t('languages.default')}</Chip>,
    },
    {
      key: 'active',
      title: t('languages.active'),
      render: (row) =>
        row.active ? (
          <Chip tone="ok">{t('languages.active')}</Chip>
        ) : (
          <Chip>{t('languages.inactive')}</Chip>
        ),
    },
  ]

  return (
    <ListLayout>
      <PageHeader
        title={t('languages.title')}
        actions={
          <Button icon={<Plus size={16} />} onClick={() => navigate('add')}>
            {t('languages.add')}
          </Button>
        }
      />

      <TableCard>
        <DataTable
          columns={columns}
          rows={list.data ?? []}
          getRowKey={(row) => row.code}
          loading={list.isPending}
          fetching={list.isFetching}
          error={list.error}
          onRetry={() => list.refetch()}
          empty={t('languages.empty')}
          actions={(row) => (
            <>
              <IconButton
                label={t('common.edit')}
                onClick={() => navigate(`update/${encodeURIComponent(row.code)}`)}
              >
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
      {/* add / update/:code render the form dialog over the list */}
      <Outlet />
    </ListLayout>
  )
}
