import { useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Upload } from 'lucide-react'
import { saveBlob } from '@/shared/lib/download'
import { Alert, Button, Field, Modal } from '@/shared/ui'
import { akfaApi } from './api'
import { toastClientError } from './helpers'
import type { MappingImportResult } from './types'

/**
 * «Загрузить через Excel» (the old AkfaMappingExcelImportModal): the template of the current links,
 * then the file back with «Akfa External ID» filled in. Shows what went in, the rows refused and —
 * on 409, when nothing was saved — the rows another admin changed meanwhile.
 */
export function MappingImportDialog({
  onClose,
  onImported,
}: {
  onClose: () => void
  /** Something was applied: the tables refresh when the dialog closes. */
  onImported: () => void
}) {
  const { t } = useTranslation()
  const fileId = useId()
  const input = useRef<HTMLInputElement>(null)
  const applied = useRef(false)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string>()
  const [downloading, setDownloading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ conflict: boolean; data: MappingImportResult } | null>(
    null,
  )

  const close = () => {
    if (applied.current) onImported()
    onClose()
  }

  const download = async () => {
    setDownloading(true)
    try {
      const { blob, fileName } = await akfaApi.mappingTemplate()
      saveBlob(blob, fileName)
    } catch (e) {
      toastClientError(e, t('akfa.common.action_error'))
    } finally {
      setDownloading(false)
    }
  }

  const upload = async () => {
    if (!file) return setFileError('akfa.excelImport.select_file_first')
    setUploading(true)
    try {
      const { conflict, result: data } = await akfaApi.importMappings(file)
      setResult({ conflict, data })
      if (!conflict && (data.applied ?? 0) > 0) applied.current = true
      setFile(null)
      if (input.current) input.current.value = ''
    } catch (e) {
      toastClientError(e, t('akfa.common.action_error'))
    } finally {
      setUploading(false)
    }
  }

  const conflicts = result?.data.conflicts ?? []
  const errors = result?.data.errors ?? []
  const nothing =
    result && conflicts.length === 0 && errors.length === 0 && (result.data.applied ?? 0) === 0

  return (
    <Modal
      open
      onClose={() => !uploading && close()}
      title={t('akfa.excelImport.title')}
      size="lg"
      footer={
        <Button variant="outline" onClick={close} disabled={uploading}>
          {t('common.close')}
        </Button>
      }
    >
      {conflicts.length > 0 && (
        <Alert tone="warn">
          <b>{t('akfa.mappingModal.conflict_title', { count: conflicts.length })}</b>{' '}
          {t('akfa.excelImport.conflict_text')}
          <ul className="mt-1.5 list-disc pl-5">
            {conflicts.map((c) => (
              <li key={`${c.productId}:${c.textureId}`}>
                {c.productName} · {c.textureName} — {t('akfa.mappingModal.conflict_now')}{' '}
                {c.currentAkfaProductName || t('akfa.mapping.winpro_unmapped').toLowerCase()}
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-xs">{t('akfa.excelImport.conflict_hint')}</p>
        </Alert>
      )}

      <section className="grid gap-1.5">
        <h4 className="font-semibold">{t('akfa.excelImport.step1_title')}</h4>
        <div>
          <Button
            variant="outline"
            icon={<Download size={16} />}
            loading={downloading}
            onClick={download}
          >
            {t('akfa.excelImport.download_button')}
          </Button>
        </div>
        <p className="text-xs text-muted">{t('akfa.excelImport.step1_hint')}</p>
      </section>

      <section className="grid gap-1.5">
        <h4 className="font-semibold">{t('akfa.excelImport.step2_title')}</h4>
        <div className="flex flex-wrap items-start gap-2.5">
          <div className="min-w-0 flex-1">
            <Field label={t('akfa.excelImport.step2_title')} htmlFor={fileId} error={fileError}>
              <input
                ref={input}
                id={fileId}
                type="file"
                accept=".xlsx"
                onChange={(e) => {
                  const chosen = e.target.files?.[0] ?? null
                  setResult(null)
                  if (chosen && !chosen.name.toLowerCase().endsWith('.xlsx')) {
                    setFileError('akfa.excelImport.invalid_extension')
                    e.target.value = ''
                    return setFile(null)
                  }
                  setFileError(undefined)
                  setFile(chosen)
                }}
                className="block w-full text-sm text-muted file:mr-3 file:h-9 file:rounded-md file:border file:border-line-strong file:bg-surface file:px-3 file:font-medium file:text-fg hover:file:border-primary"
              />
            </Field>
          </div>
          <Button
            icon={<Upload size={16} />}
            className="mt-6"
            loading={uploading}
            disabled={!file}
            onClick={upload}
          >
            {t(uploading ? 'akfa.excelImport.uploading' : 'akfa.excelImport.upload_button')}
          </Button>
        </div>
      </section>

      {result && (
        <section
          aria-label={t('akfa.excelImport.title')}
          className="grid gap-3 border-t border-line pt-4"
        >
          <dl className="grid grid-cols-3 gap-2.5">
            {(
              [
                ['stat_total', result.data.total],
                ['stat_applied', result.data.applied],
                ['stat_skipped', result.data.skipped],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                className="flex flex-col-reverse rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-center"
              >
                <dt className="text-xs text-muted">{t(`akfa.excelImport.${label}`)}</dt>
                <dd className="text-xl font-bold tabular-nums">{value ?? 0}</dd>
              </div>
            ))}
          </dl>
          {nothing && <p className="text-sm text-muted">{t('akfa.excelImport.nothing_changed')}</p>}
          {errors.length > 0 && (
            <div className="grid gap-1.5">
              <h4 className="font-semibold">
                {t('akfa.excelImport.errors_title')} ({errors.length})
              </h4>
              <div className="max-h-52 overflow-auto rounded-lg border border-line">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-surface-2 text-left text-muted">
                    <tr>
                      {(
                        [
                          'col_row',
                          'col_product_id',
                          'col_texture_id',
                          'col_field',
                          'col_value',
                          'col_message',
                        ] as const
                      ).map((col) => (
                        <th
                          key={col}
                          scope="col"
                          className="px-2.5 py-2 font-medium whitespace-nowrap"
                        >
                          {t(`akfa.excelImport.${col}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {errors.map((err, i) => (
                      <tr key={i} className="border-t border-line">
                        <td className="px-2.5 py-1.5 tabular-nums">{err.row}</td>
                        <td className="px-2.5 py-1.5">{err.productId ?? '—'}</td>
                        <td className="px-2.5 py-1.5">{err.textureId ?? '—'}</td>
                        <td className="px-2.5 py-1.5">{err.field ?? '—'}</td>
                        <td className="px-2.5 py-1.5">{err.value ?? '—'}</td>
                        <td className="px-2.5 py-1.5">{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted">{t('akfa.excelImport.errors_hint')}</p>
            </div>
          )}
        </section>
      )}
    </Modal>
  )
}
