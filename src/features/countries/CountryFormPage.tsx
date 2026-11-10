import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import { currencyLabel, useCurrencies, type Currency } from '@/shared/lookups/currencies'
import { useSession } from '@/shared/store/session'
import {
  Alert,
  Button,
  Card,
  Combobox,
  ConfirmDialog,
  Field,
  FormField,
  ImageUpload,
  Input,
  NumberInput,
  PageHeader,
  Spinner,
  Switch,
} from '@/shared/ui'
import { countryApi, countryKeys } from './api'
import { CountryGuideDialog } from './CountryGuideDialog'
import { CountryProviders } from './CountryProviders'
import { countrySchema, type CountryForm, type CountryValues } from './schema'
import type { CountryRecord } from './types'

const resolver = zodResolver(countrySchema)

const toForm = (c: CountryRecord): CountryForm => ({
  name: c.name ?? '',
  code: c.code ?? '',
  phoneCode: c.phoneCode ?? '',
  phoneFormat: c.phoneFormat ?? '',
  digitsLength: c.digitsLength ?? null,
  length: c.length ?? null,
  codeSlice: c.codeSlice ?? '',
  currencyId: c.currencyId ?? c.currency?.id ?? null,
  storageBucket: c.storageBucket ?? '',
  isActive: !!c.isActive,
  isDefault: !!c.isDefault,
  file: null,
})

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="grid gap-3.5 p-4">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </Card>
  )
}

/** /country/add and /country/update/:id — a page: the form is long and has providers below it. */
export function CountryFormPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const close = () => navigate('/country')

  const currencies = useCurrencies()
  const isAdmin = useSession((s) => s.user?.role === 'ADMINISTRATOR')
  // Adding a country: the guide opens once on arrival (as in the old panel); later — from the button.
  const [guide, setGuide] = useState(id === undefined)
  // Pending «change the bucket?» question: resolves with the answer.
  const [bucketQuestion, setBucketQuestion] = useState<((ok: boolean) => void) | null>(null)

  const [defaultValues] = useState<CountryForm>(() => ({
    name: '',
    code: '',
    phoneCode: '',
    phoneFormat: '',
    digitsLength: null,
    length: null,
    codeSlice: '',
    currencyId: null,
    storageBucket: '',
    isActive: false,
    isDefault: false,
    file: null,
  }))

  // Changing the loaded bucket asks for confirmation: new files start going elsewhere.
  const confirmBucket = (values: CountryValues): boolean | Promise<boolean> =>
    values.storageBucket === (entity?.storageBucket ?? '').trim().toLowerCase() ||
    new Promise<boolean>((resolve) => setBucketQuestion(() => resolve))

  const { form, entity, isEdit, isLoading, isSaving, submit } = useEntityForm({
    id,
    queryKey: countryKeys.all,
    fetchOne: countryApi.get,
    toForm,
    save: countryApi.save,
    resolver,
    defaultValues,
    onSaved: close,
    beforeSave: confirmBucket,
  })
  const { errors } = form.formState

  const answerBucket = (ok: boolean) => {
    bucketQuestion?.(ok)
    setBucketQuestion(null)
  }

  const count = (name: 'digitsLength' | 'length', label: string, tip: string) => (
    <FormField control={form.control} name={name} label={label} tip={tip} required>
      {(field) => (
        <NumberInput
          id={field.id}
          ref={field.ref}
          onBlur={field.onBlur}
          value={field.value}
          onChange={field.onChange}
          invalid={field.invalid}
          nonNegative
        />
      )}
    </FormField>
  )

  return (
    <div className="mx-auto grid max-w-[880px] gap-4">
      <Link
        to="/country"
        className="inline-flex w-fit items-center gap-1.5 text-muted hover:text-fg"
      >
        <ArrowLeft size={16} />
        {t('countries.back')}
      </Link>
      <PageHeader
        title={t(isEdit ? 'countries.edit' : 'countries.add')}
        actions={
          <Button variant="outline" icon={<BookOpen size={16} />} onClick={() => setGuide(true)}>
            {t('countries.guide')}
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid place-items-center py-16 text-primary">
          <Spinner className="size-6" />
        </div>
      ) : (
        <>
          <form noValidate onSubmit={submit} className="grid gap-4">
            {errors.root && <Alert>{errors.root.message}</Alert>}

            <Section title={t('countries.title')}>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field
                  label={t('countries.name')}
                  htmlFor="name"
                  error={errors.name?.message}
                  required
                >
                  <Input id="name" autoFocus invalid={!!errors.name} {...form.register('name')} />
                </Field>
                <Field
                  label={t('countries.code')}
                  htmlFor="code"
                  error={errors.code?.message}
                  required
                >
                  <Input
                    id="code"
                    placeholder="uz"
                    invalid={!!errors.code}
                    {...form.register('code')}
                  />
                </Field>
                <FormField control={form.control} name="currencyId" label={t('countries.currency')}>
                  {(field) => (
                    <Combobox<Currency>
                      id={field.id}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={currencies.data?.find((c) => c.id === field.value) ?? null}
                      onChange={(c) => field.onChange(c?.id ?? null)}
                      options={currencies.data ?? []}
                      getKey={(c) => c.id}
                      getLabel={currencyLabel}
                      loading={currencies.isPending}
                      clearable
                    />
                  )}
                </FormField>
                <FormField
                  control={form.control}
                  name="file"
                  label={t('countries.flag')}
                  tip={t('countries.flag_hint')}
                >
                  {(field) => (
                    <ImageUpload
                      id={field.id}
                      ref={field.ref}
                      value={field.value}
                      onChange={field.onChange}
                      currentUrl={entity?.flagUrl ?? undefined}
                      crop={false}
                      invalid={field.invalid}
                    />
                  )}
                </FormField>
              </div>
            </Section>

            <Section title={t('countries.section_phone')}>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field
                  label={t('countries.phone_code')}
                  htmlFor="phoneCode"
                  error={errors.phoneCode?.message}
                  required
                >
                  <Input
                    id="phoneCode"
                    placeholder="+998"
                    invalid={!!errors.phoneCode}
                    {...form.register('phoneCode')}
                  />
                </Field>
                <Field
                  label={t('countries.phone_format')}
                  htmlFor="phoneFormat"
                  tip={t('countries.phone_format_tip')}
                  error={errors.phoneFormat?.message}
                  required
                >
                  <Input
                    id="phoneFormat"
                    placeholder="+998 (##) ### ## ##"
                    invalid={!!errors.phoneFormat}
                    {...form.register('phoneFormat')}
                  />
                </Field>
                {count(
                  'digitsLength',
                  t('countries.digits_length'),
                  t('countries.digits_length_tip'),
                )}
                {count('length', t('countries.length'), t('countries.length_tip'))}
                <Field
                  label={t('countries.code_slice')}
                  htmlFor="codeSlice"
                  tip={t('countries.code_slice_tip')}
                  error={errors.codeSlice?.message}
                  required
                >
                  <Input
                    id="codeSlice"
                    placeholder={'/^\\+998/'}
                    invalid={!!errors.codeSlice}
                    {...form.register('codeSlice')}
                  />
                </Field>
              </div>
            </Section>

            <Section title={t('countries.section_storage')}>
              <Field
                label={t('countries.storage_bucket')}
                htmlFor="storageBucket"
                hint={isAdmin ? undefined : t('countries.bucket_readonly_hint')}
                error={errors.storageBucket?.message}
              >
                {/* read-only, not disabled: a disabled field would be left out and the bucket cleared */}
                <Input
                  id="storageBucket"
                  maxLength={63}
                  readOnly={!isAdmin}
                  placeholder={t('countries.storage_bucket_placeholder')}
                  invalid={!!errors.storageBucket}
                  {...form.register('storageBucket')}
                />
              </Field>
              <div className="flex flex-wrap gap-x-8 gap-y-3">
                <Switch label={t('countries.is_active')} {...form.register('isActive')} />
                <Switch label={t('countries.is_default')} {...form.register('isDefault')} />
              </div>
            </Section>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={close} disabled={isSaving}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" loading={isSaving}>
                {t(isSaving ? 'common.saving' : 'common.save')}
              </Button>
            </div>
          </form>

          {/* Outside the form: the provider dialog has a form of its own. */}
          {id && <CountryProviders countryId={id} />}
        </>
      )}

      {guide && <CountryGuideDialog onClose={() => setGuide(false)} />}
      <ConfirmDialog
        open={bucketQuestion !== null}
        tone="primary"
        title={t('countries.bucket_warning_title')}
        description={t('countries.bucket_warning_text')}
        confirmLabel={t('countries.bucket_warning_confirm')}
        onConfirm={() => answerBucket(true)}
        onCancel={() => answerBucket(false)}
      />
    </div>
  )
}
