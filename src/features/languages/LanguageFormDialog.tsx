import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import { Alert, Button, Checkbox, Field, Input, Modal, Spinner } from '@/shared/ui'
import { languageApi, languageKeys } from './api'
import { languageSchema, type LanguageForm } from './schema'
import type { Language } from './types'

const resolver = zodResolver(languageSchema)

const toForm = (l: Language): LanguageForm => ({
  code: l.code ?? '',
  name: l.name ?? '',
  isDefault: !!l.default,
  active: !!l.active,
})

/** Mounted on /languages/add and /languages/update/:code, over the list. */
export function LanguageFormDialog() {
  const { t } = useTranslation()
  const { code } = useParams()
  const navigate = useNavigate()
  const close = () => navigate('/languages')

  const [defaultValues] = useState<LanguageForm>(() => ({
    code: '',
    name: '',
    isDefault: false,
    active: true,
  }))

  const { form, isEdit, isLoading, isSaving, submit } = useEntityForm({
    id: code,
    queryKey: languageKeys.all,
    fetchOne: languageApi.get,
    toForm,
    save: languageApi.save,
    resolver,
    defaultValues,
    onSaved: close,
  })
  const { errors } = form.formState

  return (
    <Modal
      open
      onClose={close}
      title={t(isEdit ? 'languages.edit' : 'languages.add')}
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

          <Field
            label={t('languages.code')}
            htmlFor="code"
            error={errors.code?.message}
            hint={t('languages.code_hint')}
            required
          >
            {/* readOnly, not disabled: react-hook-form drops disabled fields from the values */}
            <Input
              id="code"
              autoFocus={!isEdit}
              readOnly={isEdit}
              className={isEdit ? 'bg-surface-2 text-muted' : undefined}
              invalid={!!errors.code}
              {...form.register('code')}
            />
          </Field>

          <Field label={t('languages.name')} htmlFor="name" error={errors.name?.message} required>
            <Input
              id="name"
              autoFocus={isEdit}
              invalid={!!errors.name}
              {...form.register('name')}
            />
          </Field>

          <div className="grid gap-3">
            <div className="grid gap-1">
              <Checkbox label={t('languages.default')} {...form.register('isDefault')} />
              <p className="pl-6 text-xs text-faint">{t('languages.default_hint')}</p>
            </div>
            <Checkbox label={t('languages.active')} {...form.register('active')} />
          </div>
        </>
      )}
    </Modal>
  )
}
