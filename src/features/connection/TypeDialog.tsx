import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fileUrl } from '@/shared/api/files'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import { cn } from '@/shared/lib/cn'
import { Alert, Button, Checkbox, Field, FormField, Input, Modal, NumberInput } from '@/shared/ui'
import { connectionApi, connectionKeys } from './api'
import { connectionTypeSchema, type ConnectionTypeForm, type ConnectionTypeValues } from './schema'

const resolver = zodResolver(connectionTypeSchema)

// Variants are only added: there is nothing to load.
const noRecord = (): Promise<ConnectionTypeForm> => Promise.reject(new Error('not editable'))
const toForm = (f: ConnectionTypeForm) => f

/** A new variant: name, priority and an icon (the old ModalConnectionType). */
export function TypeDialog({
  connectionId,
  onClose,
}: {
  connectionId: string
  onClose: () => void
}) {
  const { t } = useTranslation()

  const icons = useQuery({
    queryKey: [...connectionKeys.types, 'icons'],
    queryFn: ({ signal }) => connectionApi.icons(signal),
    staleTime: 10 * 60_000,
  })

  const [defaultValues] = useState<ConnectionTypeForm>(() => ({
    name: '',
    priority: null,
    connectionTypeIndex: null,
    isDefault: false,
  }))

  const save = useCallback(
    (values: ConnectionTypeValues) => connectionApi.addType(connectionId, values),
    [connectionId],
  )

  const { form, isSaving, submit } = useEntityForm({
    queryKey: connectionKeys.types,
    fetchOne: noRecord,
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
      title={t('connection.types.add')}
      onSubmit={submit}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={isSaving}>
            {t(isSaving ? 'common.saving' : 'common.save')}
          </Button>
        </>
      }
    >
      {errors.root && <Alert>{errors.root.message}</Alert>}

      <Field
        label={t('connection.types.name')}
        htmlFor="type-name"
        error={errors.name?.message}
        required
      >
        <Input id="type-name" autoFocus invalid={!!errors.name} {...form.register('name')} />
      </Field>

      <FormField
        control={form.control}
        name="priority"
        label={t('connection.types.priority')}
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

      <FormField
        control={form.control}
        name="connectionTypeIndex"
        label={t('connection.types.icon')}
      >
        {(field) => (
          <div
            id={field.id}
            role="radiogroup"
            aria-invalid={field.invalid || undefined}
            className="flex flex-wrap gap-2"
          >
            {icons.isPending && <span className="text-muted">{t('common.loading')}</span>}
            {icons.data?.map((icon) => {
              const checked = field.value === icon.id
              return (
                <button
                  key={icon.id}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  aria-label={`${t('connection.types.icon')} ${icon.id}`}
                  onClick={() => field.onChange(icon.id)}
                  className={cn(
                    'grid size-14 place-items-center overflow-hidden rounded-md border-2 p-1',
                    checked
                      ? 'border-primary bg-primary-soft'
                      : 'border-line hover:border-line-strong',
                  )}
                >
                  <img
                    src={fileUrl('connection', icon.id)}
                    alt=""
                    className="size-10 object-contain"
                  />
                </button>
              )
            })}
          </div>
        )}
      </FormField>

      <Checkbox label={t('connection.types.default')} {...form.register('isDefault')} />
    </Modal>
  )
}
