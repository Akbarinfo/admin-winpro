import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import { ProductTextureFields } from '@/shared/lookups/ProductTextureFields'
import { Alert, Button, Modal, Spinner } from '@/shared/ui'
import { insertApi, insertKeys } from './api'
import { additionalSpecSchema, type AdditionalSpecForm, type AdditionalSpecValues } from './schema'
import type { AdditionalSpecification } from './types'

const resolver = zodResolver(additionalSpecSchema)

const toForm = (s: AdditionalSpecification): AdditionalSpecForm => ({
  productId: s.productId ?? null,
  textureId: s.textureId ?? null,
})

type SpecificationDialogProps = {
  additionalId: number
  /** undefined — adding. */
  id?: string
  onClose: () => void
}

/** A product (and its texture) of an insert (the old ModalAddAdditionalSpecification). */
export function SpecificationDialog({ additionalId, id, onClose }: SpecificationDialogProps) {
  const { t } = useTranslation()
  const [defaultValues] = useState<AdditionalSpecForm>(() => ({ productId: null, textureId: null }))

  const save = useCallback(
    (values: AdditionalSpecValues, specId?: string) =>
      insertApi.saveSpec(additionalId, values, specId),
    [additionalId],
  )

  const { form, isEdit, isLoading, isSaving, submit } = useEntityForm({
    id,
    queryKey: insertKeys.specs,
    fetchOne: insertApi.spec,
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
      title={t(isEdit ? 'inserts.spec.edit' : 'inserts.spec.add')}
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
            productLabel={t('inserts.spec.product')}
            textureLabel={t('inserts.spec.texture')}
          />
        </>
      )}
    </Modal>
  )
}
