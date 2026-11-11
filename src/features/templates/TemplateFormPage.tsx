import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { ArrowLeft, Ruler } from 'lucide-react'
import { fileUrl } from '@/shared/api/files'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import { useMaterialTypes } from '@/shared/lookups/materialTypes'
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
import { DrawingFileInput, useWebcc, WebccCanvas, type WebccSizes } from '@/shared/webcc'
import { templateApi, templateKeys } from './api'
import { ChildTemplates } from './ChildTemplates'
import { emptyTemplate, templateSchema, type TemplateForm, type TemplateValues } from './schema'
import type { Template } from './types'

const resolver = zodResolver(templateSchema)

const toForm = (x: Template): TemplateForm => ({
  ...emptyTemplate(),
  name: x.name ?? '',
  materialTypeId: x.materialTypeId ?? null,
  width: x.width ?? null,
  height: x.height ?? null,
  area: x.area ?? null,
})

/**
 * /templates/add, /templates/update/:id (with its children below), and a child's
 * /templates/update/:parentId/add-child, …/update-child/:id. After saving a top-level template the
 * page starts over with the saved record (the old form reloaded the page).
 */
export function TemplateFormPage() {
  const { id, parentId } = useParams()
  const [version, setVersion] = useState(0)
  return (
    <TemplateFormBody
      key={`${parentId}/${id}/${version}`}
      id={id}
      parentId={parentId}
      onSavedHere={() => setVersion((v) => v + 1)}
    />
  )
}

type BodyProps = { id?: string; parentId?: string; onSavedHere: () => void }

function TemplateFormBody({ id, parentId, onSavedHere }: BodyProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  // Back where it was opened from, as it was left (the list's or the parent's page, sort, search);
  // by default a child goes to its parent, a template to the list.
  const from = (useLocation().state as { from?: string } | null)?.from
  const backTo = from ?? (parentId ? `/templates/update/${parentId}` : '/templates')
  // A top-level template stays open after saving: its children are on its page.
  const isTopLevelEdit = id !== undefined && !parentId
  const materialTypes = useMaterialTypes()
  const webcc = useWebcc()
  const [defaultValues] = useState(emptyTemplate)

  const { form, entity, isEdit, isLoading, loadError, isSaving, submit } = useEntityForm({
    id,
    queryKey: templateKeys.all,
    fetchOne: templateApi.get,
    toForm,
    resolver,
    defaultValues,
    save: (values: TemplateValues, recordId?: string): Promise<unknown> =>
      templateApi.save(
        values,
        { parentId, imageId: entity?.imageId ?? null, base64Image: webcc.image() },
        recordId,
      ),
    // a top-level template stays open (its children are here); a new one or a child goes back
    onSaved: () => (isTopLevelEdit ? onSavedHere() : navigate(backTo)),
  })
  const { errors } = form.formState

  const applySizes = (sizes: WebccSizes | null) => {
    if (!sizes) return
    form.setValue('width', sizes.width, { shouldDirty: true })
    form.setValue('height', sizes.height, { shouldDirty: true })
    form.setValue('area', sizes.area, { shouldDirty: true })
  }

  // The saved drawing opens once the constructor is up; its sizes replace the saved ones (as before).
  const opened = useRef(false)
  const json = entity?.templeteJson
  useEffect(() => {
    if (webcc.status !== 'ready' || !json || opened.current) return
    opened.current = true
    applySizes(webcc.openFile(json))
  })

  return (
    <div className="grid gap-4">
      <Link to={backTo} className="inline-flex w-fit items-center gap-1.5 text-muted hover:text-fg">
        <ArrowLeft size={16} />
        {t(parentId ? 'templates.back_to_parent' : 'templates.back')}
      </Link>
      <PageHeader
        title={t(
          parentId
            ? isEdit
              ? 'templates.edit_child'
              : 'templates.add_child'
            : isEdit
              ? 'templates.edit'
              : 'templates.add',
        )}
      />

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
              <FormField control={form.control} name="image" label={t('templates.image')}>
                {(field) => (
                  <ImageUpload
                    id={field.id}
                    ref={field.ref}
                    value={field.value}
                    onChange={field.onChange}
                    currentUrl={fileUrl('template', entity?.imageId)}
                    invalid={field.invalid}
                  />
                )}
              </FormField>
              <Field
                label={t('templates.name')}
                htmlFor="name"
                error={errors.name?.message}
                required
              >
                <Input id="name" invalid={!!errors.name} {...form.register('name')} />
              </Field>
              <FormField
                control={form.control}
                name="materialTypeId"
                label={t('templates.type')}
                required
              >
                {(field) => (
                  <Combobox
                    id={field.id}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={materialTypes.data?.find((m) => m.id === field.value) ?? null}
                    onChange={(m) => field.onChange(m?.id ?? null)}
                    options={materialTypes.data ?? []}
                    getKey={(m) => m.id}
                    getLabel={(m) => m.name}
                    loading={materialTypes.isPending}
                    invalid={field.invalid}
                  />
                )}
              </FormField>
              <div className="grid gap-3.5 sm:grid-cols-2">
                {(['width', 'height'] as const).map((name) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    label={t(`templates.${name}`)}
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
                      />
                    )}
                  </FormField>
                ))}
              </div>
              <DrawingFileInput
                id="json"
                onChange={(file, text) => {
                  form.setValue('json', file, { shouldDirty: true })
                  applySizes(webcc.openFile(text))
                }}
              />
            </Card>

            <Card className="grid gap-3 p-4">
              <WebccCanvas webcc={webcc} />
              <div>
                <Button
                  variant="outline"
                  icon={<Ruler size={16} />}
                  disabled={webcc.status !== 'ready'}
                  onClick={() => applySizes(webcc.sizes())}
                >
                  {t('webcc.get_sizes')}
                </Button>
              </div>
            </Card>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate(backTo)} disabled={isSaving}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={isSaving}>
              {t(isSaving ? 'common.saving' : 'common.save')}
            </Button>
          </div>
        </form>
      )}

      {isTopLevelEdit && <ChildTemplates parentId={id!} />}
    </div>
  )
}
