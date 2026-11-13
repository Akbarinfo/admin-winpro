import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { isClientError } from '@/shared/api/errors'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'

type ConfirmCopyOptions<T, R> = {
  /** Calls the copy endpoint — defined in the feature's api.ts. */
  copy: (item: T) => Promise<R>
  /** Query key refreshed after copying (the copy shows up in the list). */
  invalidate: QueryKey
  /** Name shown in the dialog: «Будет создана копия «…»». */
  getName?: (item: T) => string
  /** The dialog's own text instead of the common one (e.g. «…then its form opens»). */
  describe?: (item: T) => string
  /** Runs after copying with the server's answer, e.g. to open the copy. */
  onCopied?: (result: R, item: T) => void
}

/**
 * Confirm → copy on the server → toast → refresh (the old panels' copy buttons).
 *
 *   const copy = useConfirmCopy({ copy: (row) => xApi.copy(row.id), invalidate: xKeys.all })
 *   <IconButton onClick={() => copy.request(row)} … />
 *   {copy.dialog}
 */
export function useConfirmCopy<T, R = unknown>({
  copy,
  invalidate,
  getName,
  describe,
  onCopied,
}: ConfirmCopyOptions<T, R>) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [target, setTarget] = useState<{ item: T } | null>(null)

  const mutation = useMutation({
    mutationFn: copy,
    onSuccess: async (result, item) => {
      toast.success(t('common.copied'))
      await queryClient.invalidateQueries({ queryKey: invalidate })
      onCopied?.(result, item)
    },
    onError: (error) => {
      // 420 is already shown as a warning by the API client; 5xx as an error.
      if (isClientError(error) && error.status !== 420) toast.error(error.message)
    },
    onSettled: () => setTarget(null),
  })

  const name = target && getName?.(target.item)
  const description = target
    ? (describe?.(target.item) ?? (name ? t('common.copy_named', { name }) : t('common.copy_text')))
    : ''

  const dialog = (
    <ConfirmDialog
      open={target !== null}
      title={t('common.copy_title')}
      description={description}
      confirmLabel={t('common.copy')}
      tone="primary"
      loading={mutation.isPending}
      onConfirm={() => target && mutation.mutate(target.item)}
      onCancel={() => !mutation.isPending && setTarget(null)}
    />
  )

  return { request: (item: T) => setTarget({ item }), dialog, isCopying: mutation.isPending }
}
