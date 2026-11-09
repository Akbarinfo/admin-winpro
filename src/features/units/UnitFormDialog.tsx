import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import { Alert, Button, Field, Input, Modal, Spinner } from '@/shared/ui'
import { unitApi, unitKeys } from './api'
import { unitSchema, type UnitForm } from './schema'
import type { Unit } from './types'

const resolver = zodResolver(unitSchema)

const toForm = (u: Unit): UnitForm => ({ name: u.name ?? '', shortName: u.shortName ?? '' })

/** Mounted on /units/add and /units/update/:id, over the list. */
export function UnitFormDialog() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { search } = useLocation()
  const close = () => navigate({ pathname: '/units', search })

  const [defaultValues] = useState<UnitForm>(() => ({ name: '', shortName: '' }))

  const { form, isEdit, isLoading, isSaving, submit } = useEntityForm({
    id,
    queryKey: unitKeys.all,
    fetchOne: unitApi.get,
    toForm,
    save: unitApi.save,
    resolver,
    defaultValues,
    onSaved: close,
  })
  const { errors } = form.formState

  return (
    <Modal
      open
      onClose={close}
      title={t(isEdit ? 'units.edit' : 'units.add')}
      size="sm"
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

          <Field label={t('units.name')} htmlFor="name" error={errors.name?.message} required>
            <Input id="name" autoFocus invalid={!!errors.name} {...form.register('name')} />
          </Field>

          <Field
            label={t('units.short_name')}
            htmlFor="shortName"
            error={errors.shortName?.message}
            hint={t('units.short_name_hint')}
            required
          >
            <Input id="shortName" invalid={!!errors.shortName} {...form.register('shortName')} />
          </Field>
        </>
      )}
    </Modal>
  )
}
