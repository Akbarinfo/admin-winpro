import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import { ProductPicker } from '@/shared/lookups/ProductPicker'
import { Alert, Button, FormField, Modal, Spinner } from '@/shared/ui'
import { insertApi, insertKeys } from './api'
import { consistSchema, type ConsistForm, type ConsistValues } from './schema'
import type { Consist } from './types'

const resolver = zodResolver(consistSchema)

const toForm = (c: Consist): ConsistForm => ({
  productId: c.productId ?? null,
  productName: c.productName ?? null,
})

/** Mounted on /inserts/add and /inserts/update/:id, over the list (the old ModalInserts). */
export function InsertFormDialog() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { search } = useLocation()
  const queryClient = useQueryClient()
  const close = () => navigate({ pathname: '/inserts', search })

  const [defaultValues] = useState<ConsistForm>(() => ({ productId: null, productName: null }))

  // An edit sends the whole loaded record back with the new product, as the old modal did.
  // Decided by the URL's id, never by what is cached: an edit must not turn into a new record.
  const save = useCallback(
    (values: ConsistValues, recordId?: string) => {
      if (recordId === undefined) return insertApi.create(values)
      const record = queryClient.getQueryData<Consist>(insertKeys.detail(recordId))
      if (!record) return Promise.reject(new Error('the record is not loaded'))
      return insertApi.update(record, values)
    },
    [queryClient],
  )

  const { form, isEdit, isLoading, isSaving, loadError, submit } = useEntityForm({
    id,
    queryKey: insertKeys.all,
    fetchOne: insertApi.get,
    toForm,
    save,
    resolver,
    defaultValues,
    onSaved: close,
  })
  const { errors } = form.formState

  return (
    <Modal
      open
      onClose={close}
      title={t(isEdit ? 'inserts.edit_title' : 'inserts.add_title')}
      onSubmit={submit}
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={isSaving} disabled={isLoading || !!loadError}>
            {t(isSaving ? 'common.saving' : 'common.save')}
          </Button>
        </>
      }
    >
      {/* The record couldn't be loaded: say so instead of an empty form that would save over it. */}
      {loadError ? (
        <Alert>{t('common.load_error')}</Alert>
      ) : isLoading ? (
        <div className="grid place-items-center py-10 text-primary">
          <Spinner className="size-6" />
        </div>
      ) : (
        <>
          {errors.root && <Alert>{errors.root.message}</Alert>}
          <FormField control={form.control} name="productId" label={t('inserts.product')} required>
            {(field) => (
              <ProductPicker
                id={field.id}
                ref={field.ref}
                onBlur={field.onBlur}
                value={field.value}
                onChange={(productId, product) => {
                  field.onChange(productId)
                  form.setValue('productName', product?.name ?? null)
                }}
                invalid={field.invalid}
              />
            )}
          </FormField>
        </>
      )}
    </Modal>
  )
}
