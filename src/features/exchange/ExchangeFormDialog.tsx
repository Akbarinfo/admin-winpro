import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'
import { ArrowLeftRight } from 'lucide-react'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import { todayIso } from '@/shared/lib/format'
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
  IconButton,
  Input,
  Modal,
  NumberInput,
  Spinner,
} from '@/shared/ui'
import { exchangeApi, exchangeKeys } from './api'
import { exchangeSchema, type ExchangeForm } from './schema'
import type { Exchange } from './types'

const resolver = zodResolver(exchangeSchema)

const toForm = (e: Exchange): ExchangeForm => ({
  fromCurrencyId: e.fromCurrencyId,
  toCurrencyId: e.toCurrencyId,
  rate: e.rate,
  date: e.date ? e.date.slice(0, 10) : todayIso(),
})

const currencyKey = (c: Currency) => c.id

/** Mounted on /exchange/add and /exchange/update/:id, over the list. */
export function ExchangeFormDialog() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { search } = useLocation()
  const close = () => navigate({ pathname: '/exchange', search })

  const currencies = useCurrencies()
  const [defaultValues] = useState<ExchangeForm>(() => ({
    fromCurrencyId: null,
    toCurrencyId: null,
    rate: null,
    date: todayIso(),
  }))

  const { form, isEdit, isLoading, isSaving, submit } = useEntityForm({
    id,
    queryKey: exchangeKeys.all,
    fetchOne: exchangeApi.get,
    toForm,
    save: exchangeApi.save,
    resolver,
    defaultValues,
    onSaved: close,
  })
  const { errors } = form.formState

  const options = currencies.data ?? []
  const byId = (currencyId: number | null) => options.find((c) => c.id === currencyId) ?? null
  const fromId = useWatch({ control: form.control, name: 'fromCurrencyId' })
  // The rate is an amount in the «to» currency: dollars get cents («1,50»).
  const toId = useWatch({ control: form.control, name: 'toCurrencyId' })

  // New rate: start from the main currency, as the old panel did.
  const mainId = options.find((c) => c.isMain)?.id
  useEffect(() => {
    if (!isEdit && mainId !== undefined && form.getValues('fromCurrencyId') === null) {
      form.setValue('fromCurrencyId', mainId)
    }
  }, [isEdit, mainId, form])

  const swap = () => {
    const [from, to] = form.getValues(['fromCurrencyId', 'toCurrencyId'])
    const validate = form.formState.isSubmitted
    form.setValue('fromCurrencyId', to, { shouldValidate: validate, shouldDirty: true })
    form.setValue('toCurrencyId', from, { shouldValidate: validate, shouldDirty: true })
  }

  return (
    <Modal
      open
      onClose={close}
      title={t(isEdit ? 'exchange.edit' : 'exchange.add')}
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

          <div className="grid items-start gap-2.5 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
            <FormField
              control={form.control}
              name="fromCurrencyId"
              label={t('exchange.from')}
              required
            >
              {(field) => (
                <Combobox
                  id={field.id}
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={byId(field.value)}
                  onChange={(c) => field.onChange(c?.id ?? null)}
                  options={options}
                  getKey={currencyKey}
                  getLabel={currencyLabel}
                  loading={currencies.isPending}
                  invalid={field.invalid}
                />
              )}
            </FormField>

            <IconButton
              label={t('exchange.swap')}
              onClick={swap}
              bordered
              className="size-9 justify-self-center rounded-full text-primary max-sm:rotate-90 sm:mt-6"
            >
              <ArrowLeftRight size={16} />
            </IconButton>

            <FormField control={form.control} name="toCurrencyId" label={t('exchange.to')} required>
              {(field) => (
                <Combobox
                  id={field.id}
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={byId(field.value)}
                  onChange={(c) => field.onChange(c?.id ?? null)}
                  options={options.filter((c) => c.id !== fromId)}
                  getKey={currencyKey}
                  getLabel={currencyLabel}
                  loading={currencies.isPending}
                  invalid={field.invalid}
                />
              )}
            </FormField>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <FormField control={form.control} name="rate" label={t('exchange.rate')} required>
              {(field) => (
                <NumberInput
                  id={field.id}
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={field.invalid}
                  nonNegative
                  minDecimals={currencyDecimals(byId(toId))}
                />
              )}
            </FormField>

            <Field label={t('exchange.date')} htmlFor="date" error={errors.date?.message} required>
              <Input id="date" type="date" invalid={!!errors.date} {...form.register('date')} />
            </Field>
          </div>
        </>
      )}
    </Modal>
  )
}
