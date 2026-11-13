import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { isClientError } from '@/shared/api/errors'
import { ProductPicker } from '@/shared/lookups/ProductPicker'
import { Alert, Button, FormField, Modal } from '@/shared/ui'
import { insertApi, insertKeys } from './api'
import { copyToProductSchema, type CopyToProductForm, type CopyToProductValues } from './schema'
import type { Additional } from './types'

const resolver = zodResolver(copyToProductSchema)

/**
 * The insert copied into another product (the old ModalCopyInsertToProduct). Not a record form:
 * it saves nothing of its own, so it isn't built on useEntityForm.
 */
export function CopyToProductDialog({
  additional,
  onClose,
}: {
  additional: Additional
  onClose: () => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const form = useForm<CopyToProductForm, unknown, CopyToProductValues>({
    resolver,
    defaultValues: { productId: null },
  })

  const copy = useMutation({
    mutationFn: (v: CopyToProductValues) => insertApi.copyToProduct(additional.id, v.productId),
    onSuccess: async () => {
      toast.success(t('inserts.additional.copy_to_product_done'))
      // the target may be this very product, or a new one in the list (the old modal refreshed nothing)
      await queryClient.invalidateQueries({ queryKey: insertKeys.all })
      onClose()
    },
  })

  return (
    <Modal
      open
      onClose={onClose}
      title={t('inserts.additional.copy_to_product')}
      description={additional.name ?? undefined}
      size="sm"
      onSubmit={form.handleSubmit((v) => copy.mutate(v))}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={copy.isPending}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={copy.isPending}>
            {t('inserts.additional.copy_to_product_submit')}
          </Button>
        </>
      }
    >
      {/* the old modal showed the backend's reason in place; a 420 is already a warning toast */}
      {isClientError(copy.error) && copy.error.status !== 420 && (
        <Alert>{copy.error.message}</Alert>
      )}
      <FormField
        control={form.control}
        name="productId"
        label={t('inserts.additional.copy_to_product_choose')}
        required
      >
        {(field) => (
          <ProductPicker
            id={field.id}
            ref={field.ref}
            onBlur={field.onBlur}
            value={field.value}
            onChange={(id) => field.onChange(id)}
            invalid={field.invalid}
          />
        )}
      </FormField>
    </Modal>
  )
}
