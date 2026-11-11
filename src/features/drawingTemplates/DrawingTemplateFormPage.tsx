import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { ArrowLeft, Ruler } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fileUrl } from '@/shared/api/files'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import {
  profileSystemLabel,
  useProfileSystems,
  type ProfileSystemOption,
} from '@/shared/lookups/profileSystems'
import { useSystemTextures, type TextureOption } from '@/shared/lookups/textures'
import {
  Alert,
  Button,
  Card,
  Combobox,
  Field,
  FormField,
  ImageUpload,
  Input,
  NumberInput,
  PageHeader,
  Spinner,
} from '@/shared/ui'
import { DrawingFileInput, useWebcc, WebccCanvas } from '@/shared/webcc'
import { drawingTemplateApi, drawingTemplateKeys } from './api'
import {
  drawingTemplateSchema,
  emptyDrawingTemplate,
  type DrawingTemplateForm,
  type DrawingTemplateValues,
} from './schema'
import type { DrawingTemplate } from './types'

const resolver = zodResolver(drawingTemplateSchema)

const toForm = (x: DrawingTemplate): DrawingTemplateForm => ({
  ...emptyDrawingTemplate(),
  name: x.name ?? '',
  type: x.type ?? null,
  profileSystemId: x.profileSystemId ?? null,
  textureId: x.textureId ?? null,
  width: x.width ?? null,
  height: x.height ?? null,
  area: x.area ?? null,
})

/** /templetes/add and /templetes/update/:id (the old FormTemplete). */
export function DrawingTemplateFormPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  // Back to the list exactly as it was left: page, sort, search.
  const from = (useLocation().state as { from?: string } | null)?.from
  const backTo = from ?? '/templetes'
  const close = () => navigate(backTo)
  const webcc = useWebcc()
  const [defaultValues] = useState(emptyDrawingTemplate)

  const types = useQuery({
    // its own key: saving a template doesn't ask for the types again
    queryKey: ['drawing-template-types'],
    queryFn: ({ signal }) => drawingTemplateApi.types(signal),
    staleTime: 10 * 60_000,
  })
  const systems = useProfileSystems()

  const { form, entity, isEdit, isLoading, loadError, isSaving, submit } = useEntityForm({
    id,
    queryKey: drawingTemplateKeys.all,
    fetchOne: drawingTemplateApi.get,
    toForm,
    resolver,
    defaultValues,
    save: (values: DrawingTemplateValues, recordId?: string): Promise<unknown> =>
      drawingTemplateApi.save(values, { imageId: entity?.imageId ?? null }, recordId),
    onSaved: close,
  })
  const { errors } = form.formState
  const systemId = useWatch({ control: form.control, name: 'profileSystemId' })
  const textures = useSystemTextures(systemId)

  // The saved drawing opens once the constructor is up (the sizes stay as saved, as before).
  const opened = useRef(false)
  const json = entity?.templeteJson
  useEffect(() => {
    if (webcc.status !== 'ready' || !json || opened.current) return
    opened.current = true
    webcc.openFile(json)
  })

  // «getSizes»: the sizes, and the system and texture the drawing was made in.
  const takeFromDrawing = () => {
    const sizes = webcc.sizes()
    if (!sizes) return
    const set = { shouldDirty: true }
    form.setValue('width', sizes.width, set)
    form.setValue('height', sizes.height, set)
    form.setValue('area', sizes.area, set)
    if (sizes.profileSystemId !== null) {
      form.setValue('profileSystemId', sizes.profileSystemId, set)
      form.setValue('textureId', sizes.textureId, set)
    }
  }

  const number = (name: 'width' | 'height' | 'area') => (
    <FormField control={form.control} name={name} label={t(`drawingTemplates.${name}`)} required>
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
    <div className="grid gap-4">
      <Link to={backTo} className="inline-flex w-fit items-center gap-1.5 text-muted hover:text-fg">
        <ArrowLeft size={16} />
        {t('drawingTemplates.back')}
      </Link>
      <PageHeader title={t(isEdit ? 'drawingTemplates.edit' : 'drawingTemplates.add')} />

      {loadError ? (
        <Alert>{t('common.load_error')}</Alert>
      ) : isLoading ? (
        <div className="grid place-items-center py-16 text-primary">
          <Spinner className="size-6" />
        </div>
      ) : (
        <form noValidate onSubmit={submit} className="grid gap-4">
          {errors.root && <Alert>{errors.root.message}</Alert>}

          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
            <Card className="grid gap-3.5 p-4">
              <FormField control={form.control} name="image" label={t('drawingTemplates.image')}>
                {(field) => (
                  <ImageUpload
                    id={field.id}
                    ref={field.ref}
                    value={field.value}
                    onChange={field.onChange}
                    currentUrl={fileUrl('templete', entity?.imageId)}
                    invalid={field.invalid}
                  />
                )}
              </FormField>
              <Field
                label={t('drawingTemplates.name')}
                htmlFor="name"
                error={errors.name?.message}
                required
              >
                <Input id="name" invalid={!!errors.name} {...form.register('name')} />
              </Field>
              <FormField
                control={form.control}
                name="profileSystemId"
                label={t('drawingTemplates.profile_system')}
              >
                {(field) => (
                  <Combobox<ProfileSystemOption>
                    id={field.id}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={systems.data?.find((s) => s.id === field.value) ?? null}
                    onChange={(s) => {
                      // another system has its own textures
                      if ((s?.id ?? null) !== field.value) form.setValue('textureId', null)
                      field.onChange(s?.id ?? null)
                    }}
                    options={systems.data ?? []}
                    getKey={(s) => s.id}
                    getLabel={profileSystemLabel}
                    loading={systems.isPending}
                    clearable
                  />
                )}
              </FormField>
              <FormField
                control={form.control}
                name="textureId"
                label={t('drawingTemplates.texture')}
              >
                {(field) => (
                  <Combobox<TextureOption>
                    id={field.id}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={textures.data?.find((x) => x.id === field.value) ?? null}
                    onChange={(x) => field.onChange(x?.id ?? null)}
                    options={textures.data ?? []}
                    getKey={(x) => x.id}
                    getLabel={(x) => x.name}
                    loading={systemId !== null && textures.isPending}
                    disabled={systemId === null}
                    clearable
                  />
                )}
              </FormField>
              <FormField control={form.control} name="type" label={t('drawingTemplates.type')}>
                {(field) => (
                  <Combobox<string>
                    id={field.id}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value}
                    onChange={field.onChange}
                    options={types.data ?? []}
                    getKey={(x) => x}
                    getLabel={(x) => x}
                    loading={types.isPending}
                    clearable
                  />
                )}
              </FormField>
              <DrawingFileInput
                id="json"
                onChange={(file, text) => {
                  form.setValue('json', file, { shouldDirty: true })
                  webcc.openFile(text)
                }}
              />
              <div className="grid gap-3.5 sm:grid-cols-3">
                {number('width')}
                {number('height')}
                {number('area')}
              </div>
            </Card>

            <Card className="grid gap-3 p-4">
              <WebccCanvas webcc={webcc} />
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  icon={<Ruler size={16} />}
                  disabled={webcc.status !== 'ready'}
                  onClick={takeFromDrawing}
                >
                  {t('webcc.get_sizes')}
                </Button>
                <p className="text-sm text-muted">{t('drawingTemplates.sizes_hint')}</p>
              </div>
            </Card>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={close} disabled={isSaving}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={isSaving}>
              {t(isSaving ? 'common.saving' : 'common.save')}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
