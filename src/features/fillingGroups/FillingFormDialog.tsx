import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import {
  Alert,
  Button,
  Checkbox,
  Field,
  FormField,
  Input,
  Modal,
  NumberInput,
  Spinner,
} from '@/shared/ui'
import { fillingApi, fillingKeys } from './api'
import { fillingGroupSchema, type FillingGroupForm } from './schema'
import type { FillingGroup } from './types'

const resolver = zodResolver(fillingGroupSchema)

const toForm = (g: FillingGroup): FillingGroupForm => ({
  name: g.name ?? '',
  clearance: g.clearance ?? null,
  outer: !!g.outer,
  inner: !!g.inner,
})

/** Mounted on /filling/add and /filling/update/:id, over the list (the old AddFilling page). */
export function FillingFormDialog() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { search } = useLocation()
  const close = () => navigate({ pathname: '/filling', search })

  const [defaultValues] = useState<FillingGroupForm>(() => ({
    name: '',
    clearance: null,
    outer: false,
    inner: false,
  }))

  const { form, isEdit, isLoading, isSaving, loadError, submit } = useEntityForm({
    id,
    queryKey: fillingKeys.all,
    fetchOne: fillingApi.get,
    toForm,
    save: fillingApi.save,
    resolver,
    defaultValues,
    onSaved: close,
  })
  const { errors } = form.formState

  return (
    <Modal
      open
      onClose={close}
      title={t(isEdit ? 'fillingGroups.edit' : 'fillingGroups.add')}
      size="sm"
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
          <Field
            label={t('fillingGroups.name')}
            htmlFor="filling-name"
            error={errors.name?.message}
            required
          >
            <Input id="filling-name" autoFocus invalid={!!errors.name} {...form.register('name')} />
          </Field>
          <FormField
            control={form.control}
            name="clearance"
            label={t('fillingGroups.clearance')}
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
          <div className="grid gap-3">
            <Checkbox label={t('fillingGroups.outer')} {...form.register('outer')} />
            <Checkbox label={t('fillingGroups.inner')} {...form.register('inner')} />
          </div>
        </>
      )}
    </Modal>
  )
}
