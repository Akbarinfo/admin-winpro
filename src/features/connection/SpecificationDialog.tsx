import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useState } from 'react'
import { useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { fileUrl } from '@/shared/api/files'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import { ProductPicker } from '@/shared/lookups/ProductPicker'
import { useProductTextures, type TextureOption } from '@/shared/lookups/textures'
import { Alert, Button, Combobox, FormField, Modal, Spinner, TextureMark } from '@/shared/ui'
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
  const productId = useWatch({ control: form.control, name: 'productId' })
  const textures = useProductTextures(productId)

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

          <FormField
            control={form.control}
            name="productId"
            label={t('connection.spec.product')}
            required
          >
            {(field) => (
              <ProductPicker
                id={field.id}
                ref={field.ref}
                onBlur={field.onBlur}
                value={field.value}
                onChange={(value) => {
                  field.onChange(value)
                  // a texture belongs to its product (the old modal kept the previous one)
                  form.setValue('textureId', null)
                }}
                invalid={field.invalid}
              />
            )}
          </FormField>

          <FormField control={form.control} name="textureId" label={t('connection.spec.texture')}>
            {(field) => (
              <Combobox<TextureOption>
                id={field.id}
                ref={field.ref}
                onBlur={field.onBlur}
                value={textures.data?.find((x) => x.id === field.value) ?? null}
                onChange={(x) => field.onChange(x?.id ?? null)}
                options={textures.data ?? []}
                getKey={(x) => x.id}
                getLabel={(x) => t(x.name)}
                renderOption={(x) => (
                  <span className="flex items-center gap-2">
                    <TextureMark src={fileUrl('texture', x.imageId)} color={x.color} />
                    {t(x.name)}
                  </span>
                )}
                loading={productId !== null && textures.isPending}
                disabled={productId === null}
                clearable
              />
            )}
          </FormField>
        </>
      )}
    </Modal>
  )
}
