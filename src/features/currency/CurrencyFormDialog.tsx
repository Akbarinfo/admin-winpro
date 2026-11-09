import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import type { Currency } from '@/shared/lookups/currencies'
import { Alert, Button, Checkbox, Field, Input, Modal, Spinner } from '@/shared/ui'
import { currencyApi, currencyKeys } from './api'
import { currencySchema, type CurrencyForm } from './schema'

const resolver = zodResolver(currencySchema)

const toForm = (c: Currency): CurrencyForm => ({
  name: c.name ?? '',
  symbol: c.symbol ?? '',
  isMain: !!c.isMain,
})

/** Mounted on /currency/add and /currency/update/:id, over the list. */
export function CurrencyFormDialog() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { search } = useLocation()
  const close = () => navigate({ pathname: '/currency', search })

  const [defaultValues] = useState<CurrencyForm>(() => ({ name: '', symbol: '', isMain: false }))

  const { form, isEdit, isLoading, isSaving, submit } = useEntityForm({
    id,
    queryKey: currencyKeys.all,
    fetchOne: currencyApi.get,
    toForm,
    save: currencyApi.save,
    resolver,
    defaultValues,
    onSaved: close,
  })
  const { errors } = form.formState

  return (
    <Modal
      open
      onClose={close}
      title={t(isEdit ? 'currency.edit' : 'currency.add')}
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

          <Field label={t('currency.name')} htmlFor="name" error={errors.name?.message} required>
            <Input id="name" autoFocus invalid={!!errors.name} {...form.register('name')} />
          </Field>

          <Field
            label={t('currency.symbol')}
            htmlFor="symbol"
            error={errors.symbol?.message}
            required
          >
            <Input id="symbol" invalid={!!errors.symbol} {...form.register('symbol')} />
          </Field>

          <div className="grid gap-1">
            <Checkbox label={t('currency.main_label')} {...form.register('isMain')} />
            <p className="pl-6 text-xs text-faint">{t('currency.main_hint')}</p>
          </div>
        </>
      )}
    </Modal>
  )
}
