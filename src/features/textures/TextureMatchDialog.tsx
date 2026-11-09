import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import { Alert, Button, Combobox, FormField, Modal, Spinner } from '@/shared/ui'
import { matchApi, textureApi, textureKeys } from './api'
import { matchSchema, type MatchForm, type MatchValues } from './schema'
import type { Texture, TextureMatch } from './types'

const resolver = zodResolver(matchSchema)
const toForm = (m: TextureMatch): MatchForm => ({
  matchingTextureId: m.matchingTextureId ?? null,
  matchingSideType: m.matchingSideType ?? null,
})
const asIs = (v: string) => v

type Props = { textureId: number; match?: TextureMatch; onClose: () => void }

/** Add or edit one matching texture of `textureId`. */
export function TextureMatchDialog({ textureId, match, onClose }: Props) {
  const { t } = useTranslation()
  const textures = useQuery({
    queryKey: [...textureKeys.all, 'list'],
    queryFn: ({ signal }) => textureApi.list(signal),
    staleTime: 10 * 60_000,
  })
  const sides = useQuery({
    queryKey: [...textureKeys.all, 'side-types'],
    queryFn: ({ signal }) => matchApi.sideTypes(signal),
    staleTime: Infinity,
  })

  const [defaultValues] = useState<MatchForm>(() => ({
    matchingTextureId: null,
    matchingSideType: null,
  }))
  const { form, isEdit, isLoading, isSaving, submit } = useEntityForm({
    id: match ? String(match.id) : undefined,
    queryKey: [...textureKeys.all, 'matches'],
    fetchOne: matchApi.get,
    toForm,
    save: (values: MatchValues, id?: string) => matchApi.save(textureId, values, id),
    resolver,
    defaultValues,
    onSaved: onClose,
  })
  const { errors } = form.formState
  // A texture can't match itself.
  const options = (textures.data ?? []).filter((x) => x.id !== textureId)

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={t(isEdit ? 'textures.match_edit' : 'textures.match_add')}
      onSubmit={submit}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
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
          <FormField
            control={form.control}
            name="matchingSideType"
            label={t('textures.side')}
            required
          >
            {(field) => (
              <Combobox<string>
                id={field.id}
                ref={field.ref}
                onBlur={field.onBlur}
                value={field.value}
                onChange={field.onChange}
                options={sides.data ?? []}
                getKey={asIs}
                getLabel={(v) => t(v)}
                loading={sides.isPending}
                invalid={field.invalid}
              />
            )}
          </FormField>
          <FormField
            control={form.control}
            name="matchingTextureId"
            label={t('textures.match_texture')}
            required
          >
            {(field) => (
              <Combobox<Texture>
                id={field.id}
                ref={field.ref}
                onBlur={field.onBlur}
                value={options.find((x) => x.id === field.value) ?? null}
                onChange={(x) => field.onChange(x?.id ?? null)}
                options={options}
                getKey={(x) => x.id}
                getLabel={(x) => x.name}
                renderOption={(x) => (
                  <span className="flex items-center justify-between gap-3">
                    <span className="truncate">{x.name}</span>
                    <span
                      aria-hidden="true"
                      className="h-5 w-10 shrink-0 rounded-md border border-line-strong"
                      style={{ backgroundColor: x.color }}
                    />
                  </span>
                )}
                renderValueMark={(x) => (
                  <span
                    aria-hidden="true"
                    className="size-4 rounded border border-line-strong"
                    style={{ backgroundColor: x.color }}
                  />
                )}
                loading={textures.isPending}
                invalid={field.invalid}
              />
            )}
          </FormField>
        </>
      )}
    </Modal>
  )
}
