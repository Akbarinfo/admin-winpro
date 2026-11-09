import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type Path,
  type Resolver,
} from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ApiError, isClientError } from '@/shared/api/errors'

type EntityFormOptions<TForm extends FieldValues, TOutput, TEntity> = {
  /** Record id from the URL; undefined means «create». */
  id?: string
  /** Base query key of the resource; invalidated after saving. */
  queryKey: QueryKey
  fetchOne: (id: string, signal: AbortSignal) => Promise<TEntity>
  /** Backend record → form values. */
  toForm: (entity: TEntity) => TForm
  /** POST when id is undefined, PUT otherwise — defined in the feature's api.ts. */
  save: (values: TOutput, id?: string) => Promise<unknown>
  resolver: Resolver<TForm, unknown, TOutput>
  defaultValues: DefaultValues<TForm>
  onSaved: () => void
}

/**
 * Add/edit form: loads the record, validates, saves, shows a toast, refreshes lists.
 * Backend validation errors land under their fields; other 4xx errors in `form.formState.errors.root`.
 */
export function useEntityForm<TForm extends FieldValues, TOutput, TEntity>({
  id,
  queryKey,
  fetchOne,
  toForm,
  save,
  resolver,
  defaultValues,
  onSaved,
}: EntityFormOptions<TForm, TOutput, TEntity>) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const isEdit = id !== undefined

  const entity = useQuery({
    queryKey: [...queryKey, 'detail', id],
    queryFn: ({ signal }) => fetchOne(id!, signal),
    enabled: isEdit,
    staleTime: Infinity, // don't refetch under the user's hands while they edit
  })

  const values = useMemo(
    () => (entity.data ? toForm(entity.data) : undefined),
    [entity.data, toForm],
  )

  const form = useForm<TForm, unknown, TOutput>({
    resolver,
    defaultValues,
    values, // fills the form once the record arrives
    resetOptions: { keepDirtyValues: true },
  })

  const mutation = useMutation({
    mutationFn: (output: TOutput) => save(output, id),
    onSuccess: async () => {
      toast.success(t(isEdit ? 'common.saved' : 'common.added'))
      await queryClient.invalidateQueries({ queryKey })
      onSaved()
    },
    onError: (error) => {
      if (error instanceof ApiError && error.fields) {
        for (const [field, message] of Object.entries(error.fields)) {
          form.setError(field as Path<TForm>, { message })
        }
      } else if (isClientError(error)) {
        form.setError('root', { message: error.message })
      }
    },
  })

  return {
    form,
    isEdit,
    /** Edit mode: the record is still loading. */
    isLoading: isEdit && entity.isPending,
    loadError: entity.error,
    isSaving: mutation.isPending,
    submit: form.handleSubmit((output) => mutation.mutate(output)),
  }
}
