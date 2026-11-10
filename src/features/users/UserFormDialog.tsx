import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'
import { fileUrl } from '@/shared/api/files'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import { usePhoneCountries } from '@/shared/lookups/countries'
import {
  Alert,
  Button,
  Combobox,
  Field,
  FormField,
  ImageUpload,
  Input,
  Modal,
  PasswordInput,
  PhoneInput,
  Spinner,
} from '@/shared/ui'
import { userApi, userKeys } from './api'
import { userSchema, type UserForm } from './schema'
import { SUPPLIER_ROLES, type SupplierOption, type User, type UserRole } from './types'

const toForm = (u: User): UserForm => ({
  fullName: u.fullName ?? '',
  username: u.username ?? '',
  phone: u.phone ?? '',
  password: '',
  newPassword: '',
  role: u.role ?? '',
  supplierId: u.supplierId ?? null,
  imageId: u.imageId ?? null,
  image: null,
})

/** Mounted on /user/add and /user/update/:id, over the list. */
export function UserFormDialog() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { search } = useLocation()
  const close = () => navigate({ pathname: '/user', search })

  const phoneCountries = usePhoneCountries()
  const roles = useQuery({
    queryKey: [...userKeys.all, 'roles'],
    queryFn: ({ signal }) => userApi.roles(signal),
    staleTime: Infinity,
  })
  const suppliers = useQuery({
    queryKey: [...userKeys.all, 'suppliers'],
    queryFn: ({ signal }) => userApi.suppliers(signal),
    staleTime: 10 * 60_000,
  })

  const isEditMode = id !== undefined
  const resolver = useMemo(
    () => zodResolver(userSchema(phoneCountries, isEditMode)),
    [phoneCountries, isEditMode],
  )

  // A new user is a manager unless another role is chosen (the old panel's default).
  const [defaultValues] = useState<UserForm>(() => ({
    fullName: '',
    username: '',
    phone: '',
    password: '',
    newPassword: '',
    role: 'MANAGER',
    supplierId: null,
    imageId: null,
    image: null,
  }))

  const { form, isEdit, isLoading, isSaving, submit } = useEntityForm({
    id,
    queryKey: userKeys.all,
    fetchOne: userApi.get,
    toForm,
    save: userApi.save,
    resolver,
    defaultValues,
    onSaved: close,
  })
  const { errors } = form.formState
  const role = useWatch({ control: form.control, name: 'role' })
  const isSupplierStaff = SUPPLIER_ROLES.includes(role)

  return (
    <Modal
      open
      onClose={close}
      title={t(isEdit ? 'users.edit' : 'users.add')}
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
            label={t('users.full_name')}
            htmlFor="fullName"
            error={errors.fullName?.message}
            required
          >
            <Input
              id="fullName"
              autoFocus
              invalid={!!errors.fullName}
              {...form.register('fullName')}
            />
          </Field>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field
              label={t('users.username')}
              htmlFor="username"
              error={errors.username?.message}
              required
            >
              <Input
                id="username"
                type="email"
                autoComplete="off"
                invalid={!!errors.username}
                {...form.register('username')}
              />
            </Field>

            <FormField control={form.control} name="phone" label={t('users.phone')}>
              {(field) => (
                <PhoneInput
                  id={field.id}
                  countries={phoneCountries}
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={field.invalid}
                />
              )}
            </FormField>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            {isEdit ? (
              <Field
                label={t('users.new_password')}
                htmlFor="newPassword"
                hint={t('users.new_password_hint')}
              >
                <PasswordInput
                  id="newPassword"
                  autoComplete="new-password"
                  {...form.register('newPassword')}
                />
              </Field>
            ) : (
              <Field
                label={t('users.password')}
                htmlFor="password"
                error={errors.password?.message}
                required
              >
                <PasswordInput
                  id="password"
                  autoComplete="new-password"
                  invalid={!!errors.password}
                  {...form.register('password')}
                />
              </Field>
            )}

            <FormField control={form.control} name="role" label={t('users.role')} required>
              {(field) => (
                <Combobox<UserRole>
                  id={field.id}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={roles.data?.find((r) => r.name === field.value) ?? null}
                  onChange={(r) => field.onChange(r?.name ?? '')}
                  options={roles.data ?? []}
                  getKey={(r) => r.name}
                  getLabel={(r) => r.name}
                  loading={roles.isPending}
                  invalid={field.invalid}
                />
              )}
            </FormField>
          </div>

          {isSupplierStaff && (
            <FormField
              control={form.control}
              name="supplierId"
              label={t('users.supplier')}
              required
            >
              {(field) => (
                <Combobox<SupplierOption>
                  id={field.id}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={suppliers.data?.find((s) => s.id === field.value) ?? null}
                  onChange={(s) => field.onChange(s?.id ?? null)}
                  options={suppliers.data ?? []}
                  getKey={(s) => s.id}
                  getLabel={(s) => s.name}
                  loading={suppliers.isPending}
                  invalid={field.invalid}
                  clearable
                />
              )}
            </FormField>
          )}

          <FormField control={form.control} name="image" label={t('users.photo')}>
            {(field) => (
              <ImageUpload
                id={field.id}
                ref={field.ref}
                value={field.value}
                onChange={field.onChange}
                currentUrl={fileUrl('user', form.getValues('imageId'))}
                invalid={field.invalid}
              />
            )}
          </FormField>
        </>
      )}
    </Modal>
  )
}
