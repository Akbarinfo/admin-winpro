import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { isClientError } from '@/shared/api/errors'
import { Alert, Button, FormField, Modal, NumberInput, Select, Switch } from '@/shared/ui'
import { providerApi, providerKeys } from './api'
import { providerSchema, type ProviderForm, type ProviderValues } from './schema'
import { PROVIDERS, type CountryProvider } from './types'

const resolver = zodResolver(providerSchema)

/** Add or edit one code provider of a country (an inline row in the old panel). */
export function ProviderDialog({
  countryId,
  provider,
  onClose,
}: {
  countryId: string
  /** undefined — adding */
  provider?: CountryProvider
  onClose: () => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const form = useForm<ProviderForm, unknown, ProviderValues>({
    resolver,
    defaultValues: provider
      ? { provider: provider.provider, sortOrder: provider.sortOrder, isActive: provider.isActive }
      : { provider: 'SMS', sortOrder: 0, isActive: true },
  })
  const { errors } = form.formState

  const save = useMutation({
    mutationFn: (values: ProviderValues) => providerApi.save(countryId, values, provider?.id),
    onSuccess: async () => {
      toast.success(t(provider ? 'common.saved' : 'common.added'))
      await queryClient.invalidateQueries({ queryKey: providerKeys.of(countryId) })
      onClose()
    },
    onError: (error) => {
      if (isClientError(error)) form.setError('root', { message: error.message })
    },
  })

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={t(provider ? 'countries.providers.edit_title' : 'countries.providers.add_title')}
      onSubmit={form.handleSubmit((values) => save.mutate(values))}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={save.isPending}>
            {t(save.isPending ? 'common.saving' : 'common.save')}
          </Button>
        </>
      }
    >
      {errors.root && <Alert>{errors.root.message}</Alert>}
      <div className="grid gap-3.5 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="provider"
          label={t('countries.providers.provider')}
          required
        >
          {(field) => (
            <Select
              id={field.id}
              ref={field.ref}
              name={field.name}
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
            >
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          )}
        </FormField>
        <FormField
          control={form.control}
          name="sortOrder"
          label={t('countries.providers.sort_order')}
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
      </div>
      <Switch label={t('countries.providers.is_active')} {...form.register('isActive')} />
    </Modal>
  )
}
