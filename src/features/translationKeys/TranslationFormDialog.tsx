import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import { useActiveLanguages } from '@/shared/lookups/languages'
import type { TranslationKey } from '@/shared/translations'
import { Alert, Button, Field, Input, Modal, Spinner } from '@/shared/ui'
import { translationApi, translationKeyKeys } from './api'
import { translationSchema, type TranslationForm, type TranslationValues } from './schema'

const toForm = (x: TranslationKey): TranslationForm => ({
  key: x.key,
  values: Object.fromEntries((x.translations ?? []).map((tr) => [tr.code, tr.value ?? ''])),
})

/** /translations/add and /translations/update/:key (the old AddTranslation), over the list. */
export function TranslationFormDialog() {
  const { t } = useTranslation()
  const { key } = useParams()
  const navigate = useNavigate()
  const { search } = useLocation()
  const close = () => navigate({ pathname: '/translations', search })

  const languages = useActiveLanguages()
  const codes = useMemo(() => (languages.data ?? []).map((l) => l.code), [languages.data])
  // Built for the active languages; the form waits for them before it's shown.
  const resolver = useMemo(() => zodResolver(translationSchema(codes)), [codes])
  const [defaultValues] = useState<TranslationForm>({ key: '', values: {} })

  const { form, isEdit, isLoading, loadError, isSaving, submit } = useEntityForm({
    id: key,
    queryKey: translationKeyKeys.all,
    fetchOne: translationApi.byKey,
    toForm,
    resolver,
    defaultValues,
    // Every active language is sent (the old form). Inactive ones aren't in the form, so an edit
    // doesn't send their texts — as before; whether the backend keeps them is the backend's.
    save: (values: TranslationValues, existing?: string) =>
      translationApi.save(
        existing ?? values.key,
        codes.map((code) => ({ code, value: values.values[code] ?? '' })),
        existing !== undefined,
      ),
    onSaved: close,
  })
  const { errors } = form.formState
  const loading = isLoading || languages.isPending

  return (
    <Modal
      open
      onClose={close}
      title={t(isEdit ? 'translationKeys.edit' : 'translationKeys.add')}
      onSubmit={submit}
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            loading={isSaving}
            disabled={loading || !!loadError || languages.isError}
          >
            {t(isSaving ? 'common.saving' : 'common.save')}
          </Button>
        </>
      }
    >
      {loadError || languages.isError ? (
        <Alert>{t('common.load_error')}</Alert>
      ) : loading ? (
        <div className="grid place-items-center py-10 text-primary">
          <Spinner className="size-6" />
        </div>
      ) : (
        <>
          {errors.root && <Alert>{errors.root.message}</Alert>}
          <Field
            label={t('translationKeys.key')}
            htmlFor="tr-key"
            error={errors.key?.message}
            hint={isEdit ? t('translationKeys.key_locked') : undefined}
            required
          >
            <Input
              id="tr-key"
              autoFocus={!isEdit}
              disabled={isEdit}
              invalid={!!errors.key}
              {...form.register('key')}
            />
          </Field>
          <div className="grid gap-3.5 sm:grid-cols-2">
            {(languages.data ?? []).map((lang, i) => (
              <Field
                key={lang.code}
                label={lang.name}
                htmlFor={`tr-${lang.code}`}
                error={errors.values?.[lang.code]?.message}
                required
              >
                <Input
                  id={`tr-${lang.code}`}
                  autoFocus={isEdit && i === 0}
                  invalid={!!errors.values?.[lang.code]}
                  {...form.register(`values.${lang.code}`)}
                />
              </Field>
            ))}
          </div>
        </>
      )}
    </Modal>
  )
}
