import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BadgeCheck } from 'lucide-react'
import { toast } from 'sonner'
import { isClientError } from '@/shared/api/errors'
import { useServerTable } from '@/shared/hooks/useServerTable'
import { formatDateTime } from '@/shared/lib/format'
import {
  Chip,
  ConfirmDialog,
  DataTable,
  Highlight,
  IconButton,
  ListLayout,
  PageHeader,
  Pagination,
  SearchInput,
  TableCard,
  TableToolbar,
  type Column,
} from '@/shared/ui'
import { mobileUserApi, mobileUserKeys } from './api'
import type { MobileUser } from './types'

/** Read-only list; the only action is marking a user as checked (as in the old panel). */
export function MobileUserListPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [checking, setChecking] = useState<MobileUser | null>(null)

  const table = useServerTable<MobileUser>({
    key: 'users',
    queryKey: mobileUserKeys.all,
    fetchPage: mobileUserApi.table,
  })

  const check = useMutation({
    mutationFn: (user: MobileUser) => mobileUserApi.check(user.id),
    onSuccess: async () => {
      toast.success(t('mobileUsers.check_done'))
      await queryClient.invalidateQueries({ queryKey: mobileUserKeys.all })
    },
    onError: (error) => {
      if (isClientError(error) && error.status !== 420) toast.error(error.message)
    },
    onSettled: () => setChecking(null),
  })

  // The old panel had no sorting here.
  const columns: Column<MobileUser>[] = [
    {
      key: 'number',
      title: t('common.number'),
      className: 'w-14 text-faint tabular-nums',
      render: (_, index) => table.rowNumber(index),
    },
    {
      key: 'createdDate',
      title: t('mobileUsers.date'),
      className: 'text-muted tabular-nums whitespace-nowrap',
      render: (row) => formatDateTime(row.createdDate) || '—',
    },
    {
      key: 'fullName',
      title: t('mobileUsers.full_name'),
      className: 'font-medium',
      render: (row) => <Highlight text={row.fullName ?? ''} query={table.search} />,
    },
    { key: 'username', title: t('mobileUsers.username') },
    { key: 'phone', title: t('mobileUsers.phone'), className: 'tabular-nums whitespace-nowrap' },
    {
      key: 'role',
      title: t('mobileUsers.role'),
      render: (row) => (row.role ? <Chip>{row.role}</Chip> : '—'),
    },
    {
      key: 'isChecked',
      title: t('mobileUsers.checked'),
      render: (row) =>
        row.isChecked ? (
          <Chip tone="ok">{t('mobileUsers.checked')}</Chip>
        ) : (
          <Chip tone="warn">{t('mobileUsers.not_checked')}</Chip>
        ),
    },
    {
      key: 'workshopId',
      title: t('mobileUsers.workshop'),
      className: 'tabular-nums',
      render: (row) => row.workshopId ?? '—',
    },
  ]

  return (
    <ListLayout>
      <PageHeader title={t('mobileUsers.title')} />

      <TableCard>
        <TableToolbar>
          <SearchInput value={table.search} onChange={table.onSearchChange} />
        </TableToolbar>
        <DataTable
          columns={columns}
          rows={table.rows}
          getRowKey={(row) => row.id}
          loading={table.isLoading}
          fetching={table.isFetching}
          highlight={table.search}
          error={table.error}
          onRetry={() => table.refetch()}
          empty={table.search ? t('common.nothing_found') : t('mobileUsers.empty')}
          actions={(row) =>
            !row.isChecked && (
              <IconButton label={t('mobileUsers.check')} onClick={() => setChecking(row)}>
                <BadgeCheck size={16} />
              </IconButton>
            )
          }
        />
        <Pagination {...table.pagination} />
      </TableCard>

      <ConfirmDialog
        open={checking !== null}
        tone="primary"
        title={t('mobileUsers.check_title')}
        description={t('mobileUsers.check_text', {
          name: checking?.fullName || checking?.username || '',
        })}
        confirmLabel={t('mobileUsers.check')}
        loading={check.isPending}
        onConfirm={() => checking && check.mutate(checking)}
        onCancel={() => !check.isPending && setChecking(null)}
      />
    </ListLayout>
  )
}
