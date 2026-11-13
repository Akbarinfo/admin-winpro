import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import { useUnits, type UnitOption } from '@/shared/lookups/units'
import {
  Alert,
  Button,
  Combobox,
  Field,
  FormField,
  Input,
  Modal,
  NumberInput,
  Spinner,
} from '@/shared/ui'
import { akfaApi, akfaKeys } from './api'
import { unitMappingSchema, type UnitMappingForm } from './schema'
import type { AkfaUnitMapping } from './types'
import { unitMappingsQuery } from './unitMappingsQuery'

const resolver = zodResolver(unitMappingSchema)

const toForm = (m: AkfaUnitMapping): UnitMappingForm => ({
  akfaUnitId: m.akfaUnitId ?? null,
  akfaUnitName: m.akfaUnitName ?? '',
  unitId: m.unitId ?? null,
})

const unitLabel = (u: UnitOption) => (u.shortName ? `${u.name} (${u.shortName})` : u.name)

/** Mounted on /integrations/unit/add and /integrations/unit/update/:id, over the list. */
export function UnitMappingDialog() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const units = useUnits()
  const close = () => navigate('/integrations/unit')

  const [defaultValues] = useState<UnitMappingForm>(() => ({
    akfaUnitId: null,
    akfaUnitName: '',
    unitId: null,
  }))

  // There is no GET by id: the record comes from the list (already loaded under the dialog).
  const fetchOne = useCallback(
    async (key: string) => {
      const list = await queryClient.ensureQueryData(unitMappingsQuery)
      const found = list.find((m) => String(m.id) === key)
      if (!found) throw new Error(t('akfa.units.not_found'))
      return found
    },
    [queryClient, t],
  )

  const { form, isEdit, isLoading, isSaving, loadError, submit } = useEntityForm({
    id,
    queryKey: akfaKeys.units,
    fetchOne,
    toForm,
    save: akfaApi.saveUnitMapping,
    resolver,
    defaultValues,
    onSaved: close,
  })
  const { errors } = form.formState

  return (
    <Modal
      open
      onClose={close}
      title={t(isEdit ? 'akfa.units.edit_title' : 'akfa.units.add_title')}
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
      {loadError ? (
        <Alert>{loadError.message}</Alert>
      ) : isLoading ? (
        <div className="grid place-items-center py-10 text-primary">
          <Spinner className="size-6" />
        </div>
      ) : (
        <>
          {errors.root && <Alert>{errors.root.message}</Alert>}

          <FormField
            control={form.control}
            name="akfaUnitId"
            label={t('akfa.units.col_akfa_id')}
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
                nonNegative
                autoFocus
              />
            )}
          </FormField>

          <Field
            label={t('akfa.units.col_akfa_name')}
            htmlFor="akfaUnitName"
            error={errors.akfaUnitName?.message}
            required
          >
            <Input
              id="akfaUnitName"
              invalid={!!errors.akfaUnitName}
              {...form.register('akfaUnitName')}
            />
          </Field>

          <FormField control={form.control} name="unitId" label={t('akfa.units.col_winpro_unit')}>
            {(field) => (
              <Combobox<UnitOption>
                id={field.id}
                ref={field.ref}
                onBlur={field.onBlur}
                value={units.data?.find((u) => u.id === field.value) ?? null}
                onChange={(u) => field.onChange(u?.id ?? null)}
                options={units.data ?? []}
                getKey={(u) => u.id}
                getLabel={unitLabel}
                loading={units.isPending}
                clearable
              />
            )}
          </FormField>
        </>
      )}
    </Modal>
  )
}
