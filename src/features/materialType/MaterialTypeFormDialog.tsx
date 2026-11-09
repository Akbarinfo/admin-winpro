import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import { Alert, Button, Checkbox, Field, Input, Modal, Spinner, Textarea } from '@/shared/ui'
import { materialTypeApi, materialTypeKeys } from './api'
import { materialTypeSchema, type MaterialTypeForm } from './schema'
import type { MaterialType } from './types'

const resolver = zodResolver(materialTypeSchema)

const toForm = (e: MaterialType): MaterialTypeForm => ({
  name: e.name ?? '',
  description: e.description ?? '',
  isDefault: !!e.isDefault,
  isTesting: !!e.isTesting,
})

/** Mounted on /material-type/add and /material-type/update/:id, over the list. */
export function MaterialTypeFormDialog() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { search } = useLocation()
  const close = () => navigate({ pathname: '/material-type', search })

  const [defaultValues] = useState<MaterialTypeForm>(() => ({
    name: '',
    description: '',
    isDefault: false,
    isTesting: false,
  }))

  const { form, isEdit, isLoading, isSaving, submit } = useEntityForm({
    id,
    queryKey: materialTypeKeys.all,
    fetchOne: materialTypeApi.get,
    toForm,
    save: materialTypeApi.save,
    resolver,
    defaultValues,
    onSaved: close,
  })
  const { errors } = form.formState

  return (
    <Modal
      open
      onClose={close}
      title={t(isEdit ? 'materialType.edit' : 'materialType.add')}
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

          <Field
            label={t('materialType.name')}
            htmlFor="name"
            error={errors.name?.message}
            required
          >
            <Input id="name" autoFocus invalid={!!errors.name} {...form.register('name')} />
          </Field>

          <Field
            label={t('materialType.description')}
            htmlFor="description"
            error={errors.description?.message}
          >
            <Textarea id="description" rows={3} {...form.register('description')} />
          </Field>

          <div className="grid gap-3">
            <div className="grid gap-1">
              <Checkbox label={t('materialType.is_default')} {...form.register('isDefault')} />
              <p className="pl-6 text-xs text-faint">{t('materialType.is_default_hint')}</p>
            </div>
            <div className="grid gap-1">
              <Checkbox label={t('materialType.is_testing')} {...form.register('isTesting')} />
              <p className="pl-6 text-xs text-faint">{t('materialType.is_testing_hint')}</p>
            </div>
          </div>
        </>
      )}
    </Modal>
  )
}
