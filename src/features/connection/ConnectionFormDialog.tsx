import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import { ProductPicker } from '@/shared/lookups/ProductPicker'
import { Alert, Button, FormField, Modal, Spinner } from '@/shared/ui'
import { connectionApi, connectionKeys } from './api'
import { connectionSchema, type ConnectionForm } from './schema'
import type { Connection } from './types'

const resolver = zodResolver(connectionSchema)

const toForm = (c: Connection): ConnectionForm => ({
  product1: c.product1 ?? null,
  product2: c.product2 ?? null,
})

/** Mounted on /connection/add and /connection/update/:id, over the list (the old AddConnection). */
export function ConnectionFormDialog() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { search } = useLocation()
  const close = () => navigate({ pathname: '/connection', search })

  const [defaultValues] = useState<ConnectionForm>(() => ({ product1: null, product2: null }))

  const { form, isEdit, isLoading, isSaving, loadError, submit } = useEntityForm({
    id,
    queryKey: connectionKeys.all,
    fetchOne: connectionApi.get,
    toForm,
    save: connectionApi.save,
    resolver,
    defaultValues,
    onSaved: close,
  })
  const { errors } = form.formState

  const product = (name: 'product1' | 'product2', label: string) => (
    <FormField control={form.control} name={name} label={label} required>
      {(field) => (
        <ProductPicker
          id={field.id}
          ref={field.ref}
          onBlur={field.onBlur}
          value={field.value}
          onChange={field.onChange}
          invalid={field.invalid}
        />
      )}
    </FormField>
  )

  return (
    <Modal
      open
      onClose={close}
      title={t(isEdit ? 'connection.edit' : 'connection.add')}
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
          {product('product1', t('connection.product_1'))}
          {product('product2', t('connection.product_2'))}
        </>
      )}
    </Modal>
  )
}
