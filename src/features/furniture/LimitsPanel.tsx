import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useConfirmDelete } from '@/shared/hooks/useConfirmDelete'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import { useServerTable } from '@/shared/hooks/useServerTable'
import { formatNumber } from '@/shared/lib/format'
import {
  Alert,
  Button,
  DataTable,
  FormField,
  IconButton,
  Modal,
  NumberInput,
  Pagination,
  Panel,
  Spinner,
  type Column,
} from '@/shared/ui'
import { furnitureApi, furnitureKeys } from './api'
import { sideLimitSchema, type SideLimitForm, type SideLimitValues } from './schema'
import type { SideLimit } from './types'

const FIELDS = ['minLength', 'maxLength', 'minCorner', 'maxCorner', 'number'] as const
const LABELS: Record<(typeof FIELDS)[number], string> = {
  number: 'furniture.limit.number',
  minLength: 'furniture.limit.min_length',
  maxLength: 'furniture.limit.max_length',
  minCorner: 'furniture.limit.min_corner',
  maxCorner: 'furniture.limit.max_corner',
}

/** Side limits of the last chosen specification row (the old AccessoriesDependLimitLayout). */
export function LimitsPanel({ specId }: { specId: number }) {
  const { t } = useTranslation()
  // null — closed; 'new' — adding; otherwise the row's id.
  const [dialog, setDialog] = useState<string | null>(null)

  // The old table sent an empty order: it isn't sorted.
  const table = useServerTable<SideLimit>({
    key: 'limit',
    queryKey: furnitureKeys.limits,
    fetchPage: furnitureApi.limits,
    filter: { dependSpecificationId: specId },
    defaultSize: 10,
    sorted: false,
  })

  const del = useConfirmDelete<SideLimit>({
    remove: (row) => furnitureApi.removeLimit(row.id),
    invalidate: furnitureKeys.limits,
    getName: (row) => `№${row.number ?? ''}`,
  })

  const cell = (key: (typeof FIELDS)[number]): Column<SideLimit> => ({
    key,
    title: t(LABELS[key]),
    align: 'right',
    render: (row) => <span className="tabular-nums">{formatNumber(row[key])}</span>,
  })
  const columns = [
    cell('number'),
    cell('minLength'),
    cell('maxLength'),
    cell('minCorner'),
    cell('maxCorner'),
  ]

  return (
    <Panel
      title={t('furniture.spec.limits')}
      actions={
        <Button size="sm" icon={<Plus size={16} />} onClick={() => setDialog('new')}>
          {t('common.add')}
        </Button>
      }
    >
      <DataTable
        columns={columns}
        rows={table.rows}
        getRowKey={(row) => row.id}
        loading={table.isLoading}
        fetching={table.isFetching}
        error={table.error}
        onRetry={() => table.refetch()}
        empty={t('furniture.limit.empty')}
        skeletonRows={3}
        actions={(row) => (
          <>
            <IconButton label={t('common.edit')} onClick={() => setDialog(String(row.id))}>
              <Pencil size={16} />
            </IconButton>
            <IconButton label={t('common.delete')} tone="danger" onClick={() => del.request(row)}>
              <Trash2 size={16} />
            </IconButton>
          </>
        )}
      />
      <Pagination {...table.pagination} />

      {del.dialog}
      {dialog !== null && (
        <LimitDialog
          specId={specId}
          id={dialog === 'new' ? undefined : dialog}
          onClose={() => setDialog(null)}
        />
      )}
    </Panel>
  )
}

const resolver = zodResolver(sideLimitSchema)

const toForm = (l: SideLimit): SideLimitForm => ({
  minLength: l.minLength ?? null,
  maxLength: l.maxLength ?? null,
  minCorner: l.minCorner ?? null,
  maxCorner: l.maxCorner ?? null,
  number: l.number ?? null,
})

/** The old ModalAccessoriesDependLimit: five whole numbers, all required. */
function LimitDialog({
  specId,
  id,
  onClose,
}: {
  specId: number
  id?: string
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [defaultValues] = useState<SideLimitForm>(() => ({
    minLength: null,
    maxLength: null,
    minCorner: null,
    maxCorner: null,
    number: null,
  }))

  const save = useCallback(
    (values: SideLimitValues, limitId?: string) => furnitureApi.saveLimit(specId, values, limitId),
    [specId],
  )

  const { form, isEdit, isLoading, isSaving, loadError, submit } = useEntityForm({
    id,
    queryKey: furnitureKeys.limits,
    fetchOne: furnitureApi.limit,
    toForm,
    save,
    resolver,
    defaultValues,
    onSaved: onClose,
  })
  const { errors } = form.formState

  return (
    <Modal
      open
      onClose={onClose}
      title={t(isEdit ? 'furniture.limit.edit' : 'furniture.limit.add')}
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
            {FIELDS.map((name) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                label={t(LABELS[name])}
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
            ))}
          </div>
        </>
      )}
    </Modal>
  )
}
