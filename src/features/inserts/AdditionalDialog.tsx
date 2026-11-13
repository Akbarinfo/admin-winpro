import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import { Alert, Button, Checkbox, Field, Input, Modal, Spinner } from '@/shared/ui'
import { insertApi, insertKeys } from './api'
import { additionalSchema, type AdditionalForm, type AdditionalValues } from './schema'
import type { Additional } from './types'

const resolver = zodResolver(additionalSchema)

const toForm = (a: Additional): AdditionalForm => ({
  name: a.name ?? '',
  byDefault: !!a.byDefault,
  necessarily: !!a.necessarily,
})

type AdditionalDialogProps = {
  consistId: string
  /** undefined — adding. */
  id?: string
  onClose: () => void
}

/** An insert: name, default, required (the old ModalAddInsertsAdditional). */
export function AdditionalDialog({ consistId, id, onClose }: AdditionalDialogProps) {
  const { t } = useTranslation()
  const [defaultValues] = useState<AdditionalForm>(() => ({
    name: '',
    byDefault: false,
    necessarily: false,
  }))

  const save = useCallback(
    (values: AdditionalValues, rowId?: string) =>
      insertApi.saveAdditional(consistId, values, rowId),
    [consistId],
  )

  const { form, isEdit, isLoading, isSaving, submit } = useEntityForm({
    id,
    queryKey: insertKeys.additional,
    fetchOne: insertApi.getAdditional,
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
      title={t(isEdit ? 'inserts.additional.edit' : 'inserts.additional.add')}
      size="sm"
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
          <Field
            label={t('inserts.additional.name')}
            htmlFor="additional-name"
            error={errors.name?.message}
            required
          >
            <Input
              id="additional-name"
              autoFocus
              invalid={!!errors.name}
              {...form.register('name')}
            />
          </Field>
          <div className="grid gap-3">
            <Checkbox label={t('inserts.additional.default')} {...form.register('byDefault')} />
            <Checkbox
              label={t('inserts.additional.necessarily')}
              {...form.register('necessarily')}
            />
          </div>
        </>
      )}
    </Modal>
  )
}
