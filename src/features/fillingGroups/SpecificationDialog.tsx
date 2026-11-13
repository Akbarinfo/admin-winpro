import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import { ProductTextureFields } from '@/shared/lookups/ProductTextureFields'
import { Alert, Button, FormField, Modal, NumberInput, Spinner } from '@/shared/ui'
import { fillingApi, fillingKeys } from './api'
import { fillingSpecSchema, type FillingSpecForm, type FillingSpecValues } from './schema'
import type { FillingSpecification } from './types'

const resolver = zodResolver(fillingSpecSchema)

const toForm = (s: FillingSpecification): FillingSpecForm => ({
  thickness: s.thickness ?? null,
  productId: s.productId ?? null,
  textureId: s.textureId ?? null,
})

type SpecificationDialogProps = {
  groupId: string
  /** undefined — adding. */
  id?: string
  onClose: () => void
}

/** A product of the group: thickness, product and its texture (the old AddSpecificationModal). */
export function SpecificationDialog({ groupId, id, onClose }: SpecificationDialogProps) {
  const { t } = useTranslation()
  const [defaultValues] = useState<FillingSpecForm>(() => ({
    thickness: null,
    productId: null,
    textureId: null,
  }))

  const save = useCallback(
    (values: FillingSpecValues, specId?: string) => fillingApi.saveSpec(groupId, values, specId),
    [groupId],
  )

  const { form, isEdit, isLoading, isSaving, loadError, submit } = useEntityForm({
    id,
    queryKey: fillingKeys.specs,
    fetchOne: fillingApi.spec,
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
      title={t(isEdit ? 'fillingGroups.spec.edit' : 'fillingGroups.spec.add')}
      onSubmit={submit}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={isSaving} disabled={isLoading || !!loadError}>
            {t(isSaving ? 'common.saving' : 'common.save')}
          </Button>
        </>
      }
    >
      {loadError ? (
        <Alert>{t('common.load_error')}</Alert>
      ) : isLoading ? (
        <div className="grid place-items-center py-10 text-primary">
          <Spinner className="size-6" />
        </div>
      ) : (
        <>
          {errors.root && <Alert>{errors.root.message}</Alert>}
          <FormField
            control={form.control}
            name="thickness"
            label={t('fillingGroups.spec.thickness')}
            required
          >
            {(field) => (
              <NumberInput
                id={field.id}
                ref={field.ref}
                onBlur={field.onBlur}
                value={field.value}
                onChange={field.onChange}
                invalid={field.invalid}
                nonNegative
              />
            )}
          </FormField>
          <ProductTextureFields
            form={form}
            productLabel={t('fillingGroups.spec.product')}
            textureLabel={t('fillingGroups.spec.texture')}
          />
        </>
      )}
    </Modal>
  )
}
