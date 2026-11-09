import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'
import { fileUrl } from '@/shared/api/files'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import {
  Alert,
  Button,
  Checkbox,
  ColorInput,
  Field,
  FormField,
  ImageUpload,
  Input,
  Modal,
  NumberInput,
  Spinner,
} from '@/shared/ui'
import { textureApi, textureKeys } from './api'
import { textureSchema, type TextureForm } from './schema'
import type { Texture } from './types'

const resolver = zodResolver(textureSchema)

const toForm = (x: Texture): TextureForm => ({
  name: x.name ?? '',
  color: x.color ?? '#ffffff',
  priority: x.priority ?? null,
  isDouble: !!x.isDouble,
  imageId: x.imageId ?? null,
  image: null,
})

/** Mounted on /textures/add and /textures/update/:id, over the list. */
export function TextureFormDialog() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { search } = useLocation()
  const close = () => navigate({ pathname: '/textures', search })

  const [defaultValues] = useState<TextureForm>(() => ({
    name: '',
    color: '#ffffff',
    priority: null,
    isDouble: false,
    imageId: null,
    image: null,
  }))

  const { form, isEdit, isLoading, isSaving, submit } = useEntityForm({
    id,
    queryKey: textureKeys.all,
    fetchOne: textureApi.get,
    toForm,
    save: textureApi.save,
    resolver,
    defaultValues,
    onSaved: close,
  })
  const { errors } = form.formState

  return (
    <Modal
      open
      onClose={close}
      title={t(isEdit ? 'textures.edit' : 'textures.add')}
      onSubmit={submit}
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={isSaving}>
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

          <FormField control={form.control} name="image" label={t('textures.image')}>
            {(field) => (
              <ImageUpload
                id={field.id}
                ref={field.ref}
                value={field.value}
                onChange={field.onChange}
                currentUrl={fileUrl('texture', form.getValues('imageId'))}
              />
            )}
          </FormField>
          <Checkbox label={t('textures.is_double')} {...form.register('isDouble')} />

          <Field label={t('textures.name')} htmlFor="name" error={errors.name?.message} required>
            <Input id="name" invalid={!!errors.name} {...form.register('name')} />
          </Field>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <FormField control={form.control} name="color" label={t('textures.color')} required>
              {(field) => (
                <ColorInput
                  id={field.id}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={field.invalid}
                />
              )}
            </FormField>
            <FormField
              control={form.control}
              name="priority"
              label={t('textures.priority')}
              tip={t('textures.priority_hint')}
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
                />
              )}
            </FormField>
          </div>
        </>
      )}
    </Modal>
  )
}
