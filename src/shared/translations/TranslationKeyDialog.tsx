import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { isClientError } from '@/shared/api/errors'
import { useActiveLanguages } from '@/shared/lookups/languages'
import { Alert, Button, Field, Input, Modal, Spinner } from '@/shared/ui'
import { translationKeyApi, translationKeyKeys } from './keys'

type TranslationKeyDialogProps = {
  translationKey: string
  onClose: () => void
  /** The key was created: the field keeps it. */
  onCreated: () => void
}

/**
 * A key's texts per language (the old TranslationKeyModal): shown read-only when the key has
 * them, otherwise typed in and created. Opens inside other forms, so it has no <form> of its own:
 * Enter is caught here, or it would submit the form around it.
 */
export function TranslationKeyDialog({
  translationKey,
  onClose,
  onCreated,
}: TranslationKeyDialogProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const languages = useActiveLanguages()
  const existing = useQuery({
    queryKey: translationKeyKeys.byKey(translationKey),
    queryFn: ({ signal }) => translationKeyApi.byKey(translationKey, signal),
    // not found is an answer here: the key is to be created
    retry: false,
  })
  const texts = existing.data?.translations ?? []
  // As the old modal: any failure to find it means a new key.
  const isView = existing.isSuccess && texts.length > 0
  const loading = existing.isPending || languages.isPending

  const [values, setValues] = useState<Record<string, string>>({})
  const create = useMutation({
    mutationFn: () =>
      translationKeyApi.create(
        translationKey,
        (languages.data ?? []).map((l) => ({ code: l.code, value: values[l.code] ?? '' })),
      ),
    onSuccess: async () => {
      toast.success(t('common.saved'))
      await queryClient.invalidateQueries({ queryKey: translationKeyKeys.all })
      onCreated()
      onClose()
    },
  })

  const textOf = (code: string) =>
    isView ? (texts.find((x) => x.code === code)?.value ?? '') : (values[code] ?? '')

  return (
    <Modal
      open
      onClose={onClose}
      title={t(
        loading
          ? 'translations.key'
          : isView
            ? 'translations.key_view_title'
            : 'translations.key_create_title',
      )}
      footer={
        isView ? (
          <Button variant="outline" onClick={onClose}>
            {t('common.close')}
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose} disabled={create.isPending}>
              {t('common.cancel')}
            </Button>
            <Button
              loading={create.isPending}
              disabled={loading || languages.isError}
              onClick={() => create.mutate()}
            >
              {t(create.isPending ? 'common.saving' : 'common.save')}
            </Button>
          </>
        )
      }
    >
      <Field label={t('translations.key')} htmlFor="tk-key">
        <Input id="tk-key" value={translationKey} readOnly disabled />
      </Field>
      {isClientError(create.error) && <Alert>{create.error.message}</Alert>}
      {loading ? (
        <div className="grid place-items-center py-6 text-primary">
          <Spinner />
        </div>
      ) : languages.isError ? (
        <Alert>{t('common.load_error')}</Alert>
      ) : (
        (languages.data ?? []).map((l) => (
          <Field key={l.code} label={l.name} htmlFor={`tk-${l.code}`}>
            <Input
              id={`tk-${l.code}`}
              value={textOf(l.code)}
              disabled={isView}
              onChange={(e) => setValues((prev) => ({ ...prev, [l.code]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                if (!create.isPending) create.mutate()
              }}
            />
          </Field>
        ))
      )}
    </Modal>
  )
}
