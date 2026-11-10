import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import {
  Alert,
  Button,
  Combobox,
  Field,
  FormField,
  Input,
  Modal,
  Spinner,
  Switch,
  Textarea,
} from '@/shared/ui'
import { appVersionApi, appVersionKeys } from './api'
import { appVersionSchema, type AppVersionForm } from './schema'
import type { AppVersion } from './types'

const resolver = zodResolver(appVersionSchema)

const toForm = (v: AppVersion): AppVersionForm => ({
  platform: v.platform,
  latestVersion: v.latestVersion ?? '',
  minVersion: v.minVersion ?? '',
  forceUpdate: !!v.forceUpdate,
  storeUrl: v.storeUrl ?? '',
  releaseNotes: v.releaseNotes ?? '',
})

const asIs = (s: string) => s

/** Mounted on /app-versions/add and /app-versions/update/:platform, over the list. */
export function AppVersionFormDialog() {
  const { t } = useTranslation()
  const { platform } = useParams()
  const navigate = useNavigate()
  const close = () => navigate('/app-versions')

  const platforms = useQuery({
    queryKey: [...appVersionKeys.all, 'platforms'],
    queryFn: ({ signal }) => appVersionApi.platforms(signal),
    staleTime: Infinity,
  })

  const [defaultValues] = useState<AppVersionForm>(() => ({
    platform: '',
    latestVersion: '',
    minVersion: '',
    forceUpdate: false,
    storeUrl: '',
    releaseNotes: '',
  }))

  const { form, isEdit, isLoading, loadError, isSaving, submit } = useEntityForm({
    id: platform,
    queryKey: appVersionKeys.all,
    fetchOne: appVersionApi.get,
    toForm,
    save: appVersionApi.save,
    resolver,
    defaultValues,
    onSaved: close,
  })
  const { errors } = form.formState

  return (
    <Modal
      open
      onClose={close}
      title={t(isEdit ? 'appVersions.edit' : 'appVersions.add')}
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
      {/* The record couldn't be loaded: say so instead of showing an empty form that would overwrite it. */}
      {loadError ? (
        <Alert>{t('common.load_error')}</Alert>
      ) : isLoading ? (
        <div className="grid place-items-center py-10 text-primary">
          <Spinner className="size-6" />
        </div>
      ) : (
        <>
          {errors.root && <Alert>{errors.root.message}</Alert>}

          {/* The platform is the record's key: chosen once, fixed when editing. */}
          <FormField
            control={form.control}
            name="platform"
            label={t('appVersions.platform')}
            required
          >
            {(field) => (
              <Combobox<string>
                id={field.id}
                ref={field.ref}
                onBlur={field.onBlur}
                value={field.value || null}
                onChange={(p) => field.onChange(p ?? '')}
                options={platforms.data ?? []}
                getKey={asIs}
                getLabel={asIs}
                loading={platforms.isPending}
                invalid={field.invalid}
                disabled={isEdit}
              />
            )}
          </FormField>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field
              label={t('appVersions.latest_version')}
              htmlFor="latestVersion"
              error={errors.latestVersion?.message}
              required
            >
              <Input
                id="latestVersion"
                placeholder="0.0.4"
                invalid={!!errors.latestVersion}
                {...form.register('latestVersion')}
              />
            </Field>
            <Field
              label={t('appVersions.min_version')}
              htmlFor="minVersion"
              tip={t('appVersions.min_version_tip')}
            >
              <Input id="minVersion" placeholder="0.0.1" {...form.register('minVersion')} />
            </Field>
          </div>

          <Field label={t('appVersions.store_url')} htmlFor="storeUrl">
            <Input
              id="storeUrl"
              inputMode="url"
              placeholder="https://"
              {...form.register('storeUrl')}
            />
          </Field>

          <Field label={t('appVersions.release_notes')} htmlFor="releaseNotes">
            <Textarea id="releaseNotes" rows={4} {...form.register('releaseNotes')} />
          </Field>

          <Switch label={t('appVersions.force_update')} {...form.register('forceUpdate')} />
        </>
      )}
    </Modal>
  )
}
