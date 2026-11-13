import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import { Alert, Button, Combobox, Field, FormField, Input, Modal, Spinner } from '@/shared/ui'
import {
  parameterApi,
  parameterKeys,
  type ParameterEndpoint,
  type ParameterKind,
  type ParameterOption,
  type ParameterRow,
} from './api'
import { parameterSchema, type ParameterForm, type ParameterValues } from './schema'

const resolver = zodResolver(parameterSchema)

type ParameterDialogProps = {
  endpoint: ParameterEndpoint
  /** The owner (connection type, specification…) the parameter belongs to. */
  parentId: number
  /** undefined — adding. */
  id?: string
  onClose: () => void
}

/** Add or edit one parameter (the old AddParamComponent). */
export function ParameterDialog({ endpoint, parentId, id, onClose }: ParameterDialogProps) {
  const { t } = useTranslation()
  const { base, enumUrl, kindField, parentField } = endpoint

  const kinds = useQuery({
    queryKey: [...parameterKeys.all, 'kinds', enumUrl],
    queryFn: ({ signal }) => parameterApi.kinds(enumUrl, signal),
    staleTime: 10 * 60_000,
  })

  const [defaultValues] = useState<ParameterForm>(() => ({
    kind: null,
    kindType: null,
    objectId: null,
    value: '',
  }))

  // The saved row knows its kind by name; its type (SELECT/TEXT) is filled in from the kinds list below.
  const toForm = useCallback(
    (row: ParameterRow): ParameterForm => ({
      kind: typeof row[kindField] === 'string' ? (row[kindField] as string) : null,
      kindType: null,
      objectId: row.objectId ?? null,
      value: row.value ?? '',
    }),
    [kindField],
  )

  const save = useCallback(
    (v: ParameterValues, rowId?: string) =>
      parameterApi.save(base, {
        id: rowId === undefined ? null : Number(rowId),
        [parentField]: parentId,
        [kindField]: v.kind,
        objectId: v.kindType === 'SELECT' ? v.objectId : null,
        value: v.value,
      }),
    [base, parentField, kindField, parentId],
  )

  const fetchOne = useCallback(
    (rowId: string, signal: AbortSignal) => parameterApi.get(base, rowId, signal),
    [base],
  )

  const { form, isEdit, isLoading, isSaving, submit } = useEntityForm({
    id,
    queryKey: parameterKeys.of(base),
    fetchOne,
    toForm,
    save,
    resolver,
    defaultValues,
    onSaved: onClose,
  })
  const { errors } = form.formState
  const [kind, kindType] = useWatch({ control: form.control, name: ['kind', 'kindType'] })
  const chosenKind = kinds.data?.find((k) => k.name === kind)

  // The kind's type comes from the kinds list (an edited row knows only the kind's name).
  useEffect(() => {
    if (chosenKind && kindType !== chosenKind.type) form.setValue('kindType', chosenKind.type)
  }, [chosenKind, kindType, form])

  const optionsUrl = kindType === 'SELECT' ? chosenKind?.url : undefined
  const options = useQuery({
    queryKey: [...parameterKeys.all, 'options', optionsUrl],
    queryFn: ({ signal }) => parameterApi.options(optionsUrl!, signal),
    enabled: !!optionsUrl,
    staleTime: 10 * 60_000,
  })

  return (
    <Modal
      open
      onClose={onClose}
      title={t(isEdit ? 'parameters.edit' : 'parameters.add')}
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

          <FormField control={form.control} name="kind" label={t('parameters.parameter')} required>
            {(field) => (
              <Combobox<ParameterKind>
                id={field.id}
                ref={field.ref}
                onBlur={field.onBlur}
                value={kinds.data?.find((k) => k.name === field.value) ?? null}
                onChange={(k) => {
                  field.onChange(k?.name ?? null)
                  form.setValue('kindType', k?.type ?? null)
                  form.setValue('objectId', null)
                  form.setValue('value', '')
                }}
                options={kinds.data ?? []}
                getKey={(k) => k.id}
                getLabel={(k) => t(k.name)}
                loading={kinds.isPending}
                invalid={field.invalid}
              />
            )}
          </FormField>

          {kindType === 'SELECT' ? (
            <FormField
              control={form.control}
              name="objectId"
              label={t('parameters.value')}
              required
            >
              {(field) => (
                <Combobox<ParameterOption>
                  id={field.id}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={options.data?.find((o) => o.id === field.value) ?? null}
                  onChange={(o) => {
                    field.onChange(o?.id ?? null)
                    // the old panel sent the chosen value's shown name
                    form.setValue('value', o ? t(o.name) : '')
                  }}
                  options={options.data ?? []}
                  getKey={(o) => o.id}
                  getLabel={(o) => t(o.name)}
                  loading={options.isPending}
                  invalid={field.invalid}
                />
              )}
            </FormField>
          ) : (
            <Field
              label={t('parameters.value')}
              htmlFor="parameter-value"
              error={errors.value?.message}
              required
            >
              <Input
                id="parameter-value"
                autoComplete="off"
                invalid={!!errors.value}
                {...form.register('value')}
              />
            </Field>
          )}
        </>
      )}
    </Modal>
  )
}
