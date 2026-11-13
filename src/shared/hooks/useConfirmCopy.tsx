import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { isClientError } from '@/shared/api/errors'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'

type ConfirmCopyOptions<T> = {
  /** Calls the copy endpoint — defined in the feature's api.ts. */
  copy: (item: T) => Promise<unknown>
  /** Query key refreshed after copying (the copy shows up in the list). */
  invalidate: QueryKey
  /** Name shown in the dialog: «Будет создана копия «…»». */
  getName?: (item: T) => string
}

/**
 * Confirm → copy on the server → toast → refresh (the old panels' copy buttons).
 *
 *   const copy = useConfirmCopy({ copy: (row) => xApi.copy(row.id), invalidate: xKeys.all })
 *   <IconButton onClick={() => copy.request(row)} … />
 *   {copy.dialog}
 */
export function useConfirmCopy<T>({ copy, invalidate, getName }: ConfirmCopyOptions<T>) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [target, setTarget] = useState<{ item: T } | null>(null)

  const mutation = useMutation({
    mutationFn: copy,
    onSuccess: async () => {
      toast.success(t('common.copied'))
      await queryClient.invalidateQueries({ queryKey: invalidate })
    },
    onError: (error) => {
      // 420 is already shown as a warning by the API client; 5xx as an error.
      if (isClientError(error) && error.status !== 420) toast.error(error.message)
    },
    onSettled: () => setTarget(null),
  })

  const name = target && getName?.(target.item)

  const dialog = (
    <ConfirmDialog
      open={target !== null}
      title={t('common.copy_title')}
      description={name ? t('common.copy_named', { name }) : t('common.copy_text')}
      confirmLabel={t('common.copy')}
      tone="primary"
      loading={mutation.isPending}
      onConfirm={() => target && mutation.mutate(target.item)}
      onCancel={() => !mutation.isPending && setTarget(null)}
    />
  )

  return { request: (item: T) => setTarget({ item }), dialog, isCopying: mutation.isPending }
}
