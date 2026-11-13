import { zodResolver } from '@hookform/resolvers/zod'
import type { QueryKey } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import { ProductTextureFields } from '@/shared/lookups/ProductTextureFields'
import { Alert, Button, Checkbox, Modal, Spinner } from '@/shared/ui'
import { accessorySpecSchema, type AccessorySpecForm, type AccessorySpecValues } from './schema'
import type { AccessorySpecification } from './types'

const resolver = zodResolver(accessorySpecSchema)

// The texture is loaded on edit for every level (the old dependent and inner modals didn't,
// so saving them without picking the texture again cleared it).
const toForm = (s: AccessorySpecification): AccessorySpecForm => ({
  productId: s.productId ?? null,
  textureId: s.textureId ?? null,
  default: !!s.default,
})

type SpecDialogProps = {
  title: string
  /** The level's own query key (furnitureKeys.level): its rows' cache is never another level's. */
  queryKey: QueryKey
  /** undefined — adding. */
  id?: string
  fetchOne: (id: string, signal: AbortSignal) => Promise<AccessorySpecification>
  save: (values: AccessorySpecValues, id?: string) => Promise<unknown>
  /** The «default» switch (main specification only). */
  showDefault?: boolean
  onClose: () => void
}

/** A specification row: product, texture, and «default» on the main tab (the old spec modals). */
export function SpecDialog({
  title,
  queryKey,
  id,
  fetchOne,
  save,
  showDefault,
  onClose,
}: SpecDialogProps) {
  const { t } = useTranslation()
  const [defaultValues] = useState<AccessorySpecForm>(() => ({
    productId: null,
    textureId: null,
    default: false,
  }))

  const { form, isEdit, isLoading, isSaving, loadError, submit } = useEntityForm({
    id,
    queryKey,
    fetchOne,
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
      title={isEdit ? t('furniture.spec.edit') : title}
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
          <ProductTextureFields
            form={form}
            productLabel={t('furniture.spec.product')}
            textureLabel={t('furniture.spec.texture')}
          />
          {showDefault && (
            <Checkbox label={t('furniture.spec.default')} {...form.register('default')} />
          )}
        </>
      )}
    </Modal>
  )
}
