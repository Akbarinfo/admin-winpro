import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { fileUrl } from '@/shared/api/files'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import { useFillingArticles, useFillingGroups } from '@/shared/lookups/fillings'
import { useMaterialTypes } from '@/shared/lookups/materialTypes'
import { useProfileSystemTree } from '@/shared/lookups/profileSystems'
import { useSuppliersByName } from '@/shared/lookups/suppliers'
import {
  CountryTranslations,
  useCountryTranslations,
  type TranslationField,
} from '@/shared/translations'
import {
  Alert,
  Button,
  Combobox,
  Field,
  FormField,
  ImageUpload,
  Input,
  Modal,
  NumberInput,
  Select,
  Spinner,
  Switch,
} from '@/shared/ui'
import { profileSystemApi, profileSystemKeys } from './api'
import {
  CLIENT_SCOPE_FALLBACK,
  DEFAULT_MAX_TRACK_COUNT,
  DEFAULT_SASH_CLEARANCE,
  emptyProfileSystem,
  profileSystemSchema,
  SLIDING_TYPE_FALLBACK,
  VISIBILITIES,
  type ProfileSystemForm,
} from './schema'
import { CharacteristicsFields } from './CharacteristicsFields'
import { flattenWithPath } from './tree'
import type { ProfileSystem } from './types'

const resolver = zodResolver(profileSystemSchema)

const toForm = (s: ProfileSystem): ProfileSystemForm => ({
  ...emptyProfileSystem(),
  name: s.name ?? '',
  // The old modal didn't load the parent: the picker is disabled on edit and parentId goes as null.
  parentId: null,
  fillingGroupId: s.fillingGroupId ?? null,
  defaultGlassId: s.defaultGlassId ?? null,
  defaultPanelId: s.defaultPanelId ?? null,
  materialTypeId: s.materialTypeId ?? null,
  supplierId: s.supplierId ?? null,
  visibility: s.visibility || 'PUBLIC',
  slidingType: s.slidingType || 'NONE',
  clientScope: s.clientScope || 'ALL',
  sashClearance: s.sashClearance ?? null,
  maxTrackCount: s.maxTrackCount ?? null,
  isVisible: !!s.isVisible,
  isDefault: !!s.isDefault,
  isTesting: !!s.isTesting,
  characteristics: (s.profileSystemFullInfo?.characteristics ?? []).map((c) => ({
    ...c,
    key: c.key ?? '',
    value: c.value ?? '',
  })),
})

/** The system's own name per country (entity type PROFILE_SYSTEM). */
const TRANSLATION_FIELDS: TranslationField[] = [{ key: 'NAME', label: 'profileSystems.name' }]

type IdName = { id: number; name: string }

/**
 * Add or edit a profile system (the old ModalAddProfileSystem). Saves the system, then its
 * characteristics, then its translations.
 */
export function SystemFormDialog({ id, onClose }: { id?: string; onClose: () => void }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const tree = useProfileSystemTree()
  const fillingGroups = useFillingGroups()
  const fillingArticles = useFillingArticles()
  const materialTypes = useMaterialTypes()
  const suppliers = useSuppliersByName()
  const slidingTypes = useQuery({
    queryKey: [...profileSystemKeys.all, 'sliding-types'],
    queryFn: ({ signal }) => profileSystemApi.slidingTypes(signal),
    staleTime: Infinity,
  })
  const clientScopes = useQuery({
    queryKey: [...profileSystemKeys.all, 'client-scopes'],
    queryFn: ({ signal }) => profileSystemApi.clientScopes(signal),
    staleTime: Infinity,
  })
  const parents = useMemo(() => flattenWithPath(tree.data ?? []), [tree.data])

  const translationFields = TRANSLATION_FIELDS.map((f) => ({ ...f, label: t(f.label) }))
  const translations = useCountryTranslations(
    'PROFILE_SYSTEM',
    id === undefined ? undefined : Number(id),
    TRANSLATION_FIELDS,
  )

  const [defaultValues] = useState(emptyProfileSystem)

  const { form, entity, isEdit, isLoading, loadError, isSaving, submit } = useEntityForm({
    id,
    queryKey: profileSystemKeys.all,
    fetchOne: profileSystemApi.get,
    toForm,
    resolver,
    defaultValues,
    onSaved: onClose,
    // The system, then its characteristics and translations: a new one has its id only after saving.
    save: async (values, recordId) => {
      const saved = await profileSystemApi.save(values, recordId)
      const systemId = recordId ? Number(recordId) : saved?.id
      if (systemId === undefined) return
      const fullInfoId = entity?.profileSystemFullInfo?.id ?? null
      // The old modal skipped an empty list, so the last row could never be removed:
      // a system that has its record gets the empty list too.
      if (values.characteristics.length > 0 || fullInfoId !== null)
        await profileSystemApi.saveFullInfo(fullInfoId, systemId, values.characteristics)
      try {
        await translations.save(systemId)
      } catch (error) {
        toast.error(t('translations.save_error'))
        // The system itself is saved: show it and close, so saving again doesn't make a second one.
        await queryClient.invalidateQueries({ queryKey: profileSystemKeys.all })
        onClose()
        throw error
      }
    },
  })
  const { errors } = form.formState
  const [name, slidingType] = useWatch({ control: form.control, name: ['name', 'slidingType'] })

  const pick = (
    name:
      | 'parentId'
      | 'fillingGroupId'
      | 'defaultGlassId'
      | 'defaultPanelId'
      | 'materialTypeId'
      | 'supplierId',
    label: string,
    query: { data?: IdName[]; isPending: boolean },
    options: { disabled?: boolean; options?: IdName[] } = {},
  ) => (
    <FormField control={form.control} name={name} label={label}>
      {(field) => {
        const list = options.options ?? query.data ?? []
        return (
          <Combobox<IdName>
            id={field.id}
            ref={field.ref}
            onBlur={field.onBlur}
            value={list.find((x) => x.id === field.value) ?? null}
            onChange={(x) => field.onChange(x?.id ?? null)}
            options={list}
            getKey={(x) => x.id}
            getLabel={(x) => x.name}
            loading={query.isPending}
            disabled={options.disabled}
            clearable
          />
        )
      }}
    </FormField>
  )

  const enumSelect = (
    name: 'visibility' | 'slidingType' | 'clientScope',
    label: string,
    values: string[],
    labelOf: (v: string) => string,
    hint?: string,
  ) => (
    <Field label={label} htmlFor={`ps-${name}`} hint={hint}>
      <Select id={`ps-${name}`} {...form.register(name)}>
        {values.map((v) => (
          <option key={v} value={v}>
            {labelOf(v)}
          </option>
        ))}
      </Select>
    </Field>
  )

  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      title={t(isEdit ? 'profileSystems.edit' : 'profileSystems.add')}
      onSubmit={submit}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={isSaving} disabled={isLoading || !!loadError}>
            {t(isSaving ? 'common.saving' : 'common.save')}
          </Button>
        </>
      }
    >
      {loadError ? (
        <Alert>{t('common.load_error')}</Alert>
      ) : isLoading ? (
        <div className="grid place-items-center py-10 text-primary">
          <Spinner className="size-6" />
        </div>
      ) : (
        <>
          {errors.root && <Alert>{errors.root.message}</Alert>}
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field
              label={t('profileSystems.name')}
              htmlFor="ps-name"
              error={errors.name?.message}
              required
            >
              <Input id="ps-name" autoFocus invalid={!!errors.name} {...form.register('name')} />
            </Field>
            {pick('parentId', t('profileSystems.parent'), tree, {
              options: parents,
              // as the old modal: a system stays where it is
              disabled: isEdit,
            })}
            {pick('fillingGroupId', t('profileSystems.default_filling'), fillingGroups)}
            {pick('defaultGlassId', t('profileSystems.glass'), fillingArticles)}
            {pick('defaultPanelId', t('profileSystems.panel'), fillingArticles)}
            {pick('materialTypeId', t('profileSystems.material_type'), materialTypes)}
            {pick('supplierId', t('profileSystems.supplier'), suppliers)}
            {enumSelect('visibility', t('profileSystems.visibility'), VISIBILITIES, (v) =>
              t(`profileSystems.visibility_option.${v}`, { defaultValue: v }),
            )}
            {enumSelect(
              'slidingType',
              t('profileSystems.sliding_type'),
              slidingTypes.data ?? SLIDING_TYPE_FALLBACK,
              (v) => t(`profileSystems.sliding_type_option.${v}`, { defaultValue: v }),
            )}
            {enumSelect(
              'clientScope',
              t('profileSystems.client_scope'),
              clientScopes.data ?? CLIENT_SCOPE_FALLBACK,
              (v) => t(`profileSystems.client_scope_option.${v}`, { defaultValue: v }),
              t('profileSystems.client_scope_hint'),
            )}
            <FormField
              control={form.control}
              name="sashClearance"
              label={t('profileSystems.sash_clearance')}
              hint={t('profileSystems.sash_clearance_hint')}
            >
              {(field) => (
                <NumberInput
                  id={field.id}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={field.invalid}
                  placeholder={String(DEFAULT_SASH_CLEARANCE)}
                  nonNegative
                />
              )}
            </FormField>
            {slidingType !== 'NONE' && (
              <FormField
                control={form.control}
                name="maxTrackCount"
                label={t('profileSystems.max_track_count')}
                hint={t(
                  slidingType === 'MULTI_TRACK_FRAME'
                    ? 'profileSystems.max_track_count_from_frames'
                    : 'profileSystems.max_track_count_hint',
                )}
              >
                {(field) => (
                  <NumberInput
                    id={field.id}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    // A warm system counts it from its frame profiles: shown empty and locked.
                    value={slidingType === 'MULTI_TRACK_FRAME' ? null : field.value}
                    onChange={field.onChange}
                    invalid={field.invalid}
                    disabled={slidingType === 'MULTI_TRACK_FRAME'}
                    placeholder={String(DEFAULT_MAX_TRACK_COUNT)}
                    nonNegative
                  />
                )}
              </FormField>
            )}
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <Switch label={t('profileSystems.visible')} {...form.register('isVisible')} />
            <Switch label={t('profileSystems.default')} {...form.register('isDefault')} />
            <Switch label={t('profileSystems.testing')} {...form.register('isTesting')} />
          </div>

          <FormField control={form.control} name="image" label={t('profileSystems.image')}>
            {(field) => (
              <ImageUpload
                id={field.id}
                ref={field.ref}
                value={field.value}
                onChange={field.onChange}
                currentUrl={fileUrl('profile', entity?.imageId)}
                invalid={field.invalid}
              />
            )}
          </FormField>

          <CharacteristicsFields control={form.control} />

          <div className="grid gap-2">
            <h3 className="font-semibold">{t('translations.title')}</h3>
            <CountryTranslations
              state={translations}
              fields={translationFields}
              defaults={{ NAME: name }}
            />
          </div>
        </>
      )}
    </Modal>
  )
}
