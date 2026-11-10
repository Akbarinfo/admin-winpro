import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { isClientError } from '@/shared/api/errors'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'

type ConfirmDeleteOptions<T> = {
  /** Calls DELETE — defined in the feature's api.ts. */
  remove: (item: T) => Promise<unknown>
  /** Query key refreshed after a successful delete (usually the resource's base key). */
  invalidate: QueryKey
  /** Name shown in the dialog: «Удалить «USD → UZS»?» */
  getName?: (item: T) => string
  /** Runs after a successful delete, e.g. to refresh another list or close a panel of the item. */
  onDeleted?: (item: T) => void
}

/**
 * Confirm → DELETE → toast → refresh, in one place.
 *
 *   const del = useConfirmDelete({ remove: (row) => exchangeApi.remove(row.id), invalidate: exchangeKeys.all })
 *   <IconButton onClick={() => del.request(row)} … />
 *   {del.dialog}
 */
export function useConfirmDelete<T>({
  remove,
  invalidate,
  getName,
  onDeleted,
}: ConfirmDeleteOptions<T>) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [target, setTarget] = useState<{ item: T } | null>(null)

  const mutation = useMutation({
    mutationFn: remove,
    onSuccess: async (_, item) => {
      toast.success(t('common.deleted'))
      await queryClient.invalidateQueries({ queryKey: invalidate })
      onDeleted?.(item)
    },
    onError: (error) => {
      // 420 (e.g. the record is in use) is already shown as a warning by the API client; 5xx as an error.
      if (isClientError(error) && error.status !== 420) toast.error(error.message)
    },
    onSettled: () => setTarget(null),
  })

  const name = target && getName?.(target.item)

  const dialog = (
    <ConfirmDialog
      open={target !== null}
      title={t('common.delete_title')}
      description={name ? t('common.delete_named', { name }) : t('common.delete_text')}
      confirmLabel={t('common.delete')}
      loading={mutation.isPending}
      onConfirm={() => target && mutation.mutate(target.item)}
      onCancel={() => !mutation.isPending && setTarget(null)}
    />
  )

  return { request: (item: T) => setTarget({ item }), dialog, isDeleting: mutation.isPending }
}
