import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import { ProductTextureFields } from '@/shared/lookups/ProductTextureFields'
import { Alert, Button, Modal, Spinner } from '@/shared/ui'
import { connectionApi, connectionKeys } from './api'
import { connectionSpecSchema, type ConnectionSpecForm, type ConnectionSpecValues } from './schema'
import type { ConnectionSpecification } from './types'

const resolver = zodResolver(connectionSpecSchema)

const toForm = (s: ConnectionSpecification): ConnectionSpecForm => ({
  productId: s.productId ?? null,
  textureId: s.textureId ?? null,
})

type SpecificationDialogProps = {
  typeId: number
  /** undefined — adding. */
  id?: string
  onClose: () => void
}

/** A product (and its texture) of a variant (the old ModalAddConnectionSpecification). */
export function SpecificationDialog({ typeId, id, onClose }: SpecificationDialogProps) {
  const { t } = useTranslation()
  const [defaultValues] = useState<ConnectionSpecForm>(() => ({ productId: null, textureId: null }))

  const save = useCallback(
    (values: ConnectionSpecValues, specId?: string) =>
      connectionApi.saveSpec(typeId, values, specId),
    [typeId],
  )

  const { form, isEdit, isLoading, isSaving, submit } = useEntityForm({
    id,
    queryKey: connectionKeys.specs,
    fetchOne: connectionApi.spec,
    toForm,
    save,
    resolver,
    defaultValues,
    onSaved: onClose,
  })
  const { errors } = form.formState

  return (
    <Modal
      open
      onClose={onClose}
      title={t(isEdit ? 'connection.spec.edit' : 'connection.spec.add')}
      onSubmit={submit}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={isSaving} disabled={isLoading}>
            {t(isSaving ? 'common.saving' : 'common.save')}
          </Button>
        </>
      }
    >
      {isLoading ? (
        <div className="grid place-items-center py-10 text-primary">
          <Spinner className="size-6" />
        </div>
      ) : (
        <>
          {errors.root && <Alert>{errors.root.message}</Alert>}

          <ProductTextureFields
            form={form}
            productLabel={t('connection.spec.product')}
            textureLabel={t('connection.spec.texture')}
          />
        </>
      )}
    </Modal>
  )
}
