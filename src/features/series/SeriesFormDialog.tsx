import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import { Alert, Button, Field, Input, Modal, Spinner, Textarea } from '@/shared/ui'
import { seriesApi, seriesKeys } from './api'
import { seriesSchema, type SeriesForm } from './schema'
import type { Series } from './types'

const resolver = zodResolver(seriesSchema)

const toForm = (e: Series): SeriesForm => ({
  name: e.name ?? '',
  description: e.description ?? '',
})

/** Mounted on /series/add and /series/update/:id, over the list. */
export function SeriesFormDialog() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { search } = useLocation()
  const close = () => navigate({ pathname: '/series', search })

  const [defaultValues] = useState<SeriesForm>(() => ({ name: '', description: '' }))

  const { form, isEdit, isLoading, isSaving, submit } = useEntityForm({
    id,
    queryKey: seriesKeys.all,
    fetchOne: seriesApi.get,
    toForm,
    save: seriesApi.save,
    resolver,
    defaultValues,
    onSaved: close,
  })
  const { errors } = form.formState

  return (
    <Modal
      open
      onClose={close}
      title={t(isEdit ? 'series.edit' : 'series.add')}
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

          <Field label={t('series.name')} htmlFor="name" error={errors.name?.message} required>
            <Input id="name" autoFocus invalid={!!errors.name} {...form.register('name')} />
          </Field>

          <Field
            label={t('series.description')}
            htmlFor="description"
            error={errors.description?.message}
          >
            <Textarea id="description" rows={3} {...form.register('description')} />
          </Field>
        </>
      )}
    </Modal>
  )
}
