import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import {
  currencyDecimals,
  currencyLabel,
  useCurrencies,
  type Currency,
} from '@/shared/lookups/currencies'
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
import { workshopServiceApi, workshopServiceKeys } from './api'
import { useCalculationTypes, useServiceTypes } from './lookups'
import { workshopServiceSchema, type WorkshopServiceForm } from './schema'
import type { CalculationType, ServiceType, WorkshopService } from './types'

const resolver = zodResolver(workshopServiceSchema)

const toForm = (s: WorkshopService): WorkshopServiceForm => ({
  name: s.name ?? '',
  calculationType: s.calculationType?.key ?? null,
  price: s.price ?? null,
  currencyId: s.currency?.id ?? null,
  serviceType: s.serviceType ?? null,
})

/** Mounted on /workshop-service/add and /workshop-service/update/:id, over the list. */
export function WorkshopServiceFormDialog() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { search } = useLocation()
  const close = () => navigate({ pathname: '/workshop-service', search })

  const currencies = useCurrencies()
  const serviceTypes = useServiceTypes()
  const calculationTypes = useCalculationTypes()

  const [defaultValues] = useState<WorkshopServiceForm>(() => ({
    name: '',
    calculationType: null,
    price: null,
    currencyId: null,
    serviceType: null,
  }))

  const { form, isEdit, isLoading, isSaving, submit } = useEntityForm({
    id,
    queryKey: workshopServiceKeys.all,
    fetchOne: workshopServiceApi.get,
    toForm,
    save: workshopServiceApi.save,
    resolver,
    defaultValues,
    onSaved: close,
  })
  const { errors } = form.formState
  const currencyId = useWatch({ control: form.control, name: 'currencyId' })
  const currencyById = (cid: number | null) => currencies.data?.find((c) => c.id === cid) ?? null

  return (
    <Modal
      open
      onClose={close}
      title={t(isEdit ? 'workshopService.edit' : 'workshopService.add')}
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
            label={t('workshopService.name')}
            htmlFor="name"
            error={errors.name?.message}
            required
          >
            <Input id="name" autoFocus invalid={!!errors.name} {...form.register('name')} />
          </Field>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="serviceType"
              label={t('workshopService.service_type')}
            >
              {(field) => (
                <Combobox<ServiceType>
                  id={field.id}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={serviceTypes.data?.find((s) => s.id === field.value) ?? null}
                  onChange={(s) => field.onChange(s?.id ?? null)}
                  options={serviceTypes.data ?? []}
                  getKey={(s) => s.id}
                  getLabel={(s) => s.name}
                  loading={serviceTypes.isPending}
                  clearable
                />
              )}
            </FormField>

            <FormField
              control={form.control}
              name="calculationType"
              label={t('workshopService.calculation_type')}
            >
              {(field) => (
                <Combobox<CalculationType>
                  id={field.id}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={calculationTypes.data?.find((c) => c.key === field.value) ?? null}
                  onChange={(c) => field.onChange(c?.key ?? null)}
                  options={calculationTypes.data ?? []}
                  getKey={(c) => c.key}
                  getLabel={(c) => c.value}
                  loading={calculationTypes.isPending}
                  clearable
                />
              )}
            </FormField>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <FormField control={form.control} name="price" label={t('workshopService.price')}>
              {(field) => (
                <NumberInput
                  id={field.id}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={field.invalid}
                  nonNegative
                  minDecimals={currencyDecimals(currencyById(currencyId))}
                />
              )}
            </FormField>

            <FormField
              control={form.control}
              name="currencyId"
              label={t('workshopService.currency')}
            >
              {(field) => (
                <Combobox<Currency>
                  id={field.id}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={currencyById(field.value)}
                  onChange={(c) => field.onChange(c?.id ?? null)}
                  options={currencies.data ?? []}
                  getKey={(c) => c.id}
                  getLabel={currencyLabel}
                  loading={currencies.isPending}
                  clearable
                />
              )}
            </FormField>
          </div>
        </>
      )}
    </Modal>
  )
}
