import { useId, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, FileSpreadsheet } from 'lucide-react'
import { isClientError } from '@/shared/api/errors'
import { cn } from '@/shared/lib/cn'
import { Button } from './Button'
import { Modal } from './Modal'

type ExcelUploadDialogProps = {
  title: string
  onClose: () => void
  /** Downloads the example file to fill in; none — the import has no example file. */
  onTemplate?: () => Promise<unknown>
  /** Sends the file; `onProgress` gets 0–100. Resolves when done — the dialog then closes. */
  onUpload: (file: File, onProgress: (percent: number) => void) => Promise<unknown>
  /** A line about what the import does, e.g. that it replaces unsaved edits. */
  hint?: ReactNode
}

const isExcel = (file: File) => /\.xlsx?$/i.test(file.name)

/** Import from Excel: pick or drop a file, get the template, watch the upload (the old UploadModal). */
export function ExcelUploadDialog({
  title,
  onClose,
  onTemplate,
  onUpload,
  hint,
}: ExcelUploadDialogProps) {
  const { t } = useTranslation()
  const inputId = useId()
  const errorId = `${inputId}-error`
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [template, setTemplate] = useState(false)

  const pick = (chosen: File | undefined) => {
    if (!chosen) return
    if (!isExcel(chosen)) return setError(t('excel.not_excel'))
    setError(null)
    setFile(chosen)
  }

  const uploading = progress !== null
  const upload = async () => {
    if (!file) return setError(t('excel.choose_file'))
    setProgress(0)
    try {
      await onUpload(file, setProgress)
      onClose()
    } catch (e) {
      // 4xx (e.g. a wrong file) is the user's to fix: say it here. 5xx and network errors are toasted by the client.
      if (isClientError(e)) setError(e.message)
      setProgress(null)
    }
  }

  const downloadTemplate = async () => {
    setTemplate(true)
    try {
      await onTemplate?.()
    } catch (e) {
      if (isClientError(e)) setError(e.message)
    } finally {
      setTemplate(false)
    }
  }

  return (
    <Modal
      open
      onClose={() => !uploading && onClose()}
      title={title}
      size="sm"
      // No <form> here: the dialog can open inside a page's form (translations), and a nested
      // form's submit would bubble up and save that page too.
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            {t('common.cancel')}
          </Button>
          <Button loading={uploading} onClick={upload}>
            {t('excel.upload')}
          </Button>
        </>
      }
    >
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          pick(e.dataTransfer.files[0])
        }}
        className={cn(
          'grid cursor-pointer justify-items-center gap-1.5 rounded-lg border border-dashed px-4 py-7 text-center',
          'focus-within:border-primary focus-within:shadow-[0_0_0_3px_var(--primary-soft)]',
          dragging ? 'border-primary bg-primary-soft' : 'border-line-strong bg-surface-2',
          error && 'border-danger',
        )}
      >
        <FileSpreadsheet size={32} className="text-primary" aria-hidden="true" />
        <span className="font-medium">{file ? file.name : t('excel.choose_file')}</span>
        <span className="text-[12.5px] text-muted">
          {file ? t('excel.change_file') : t('excel.drop_hint')}
        </span>
        <input
          id={inputId}
          type="file"
          accept=".xlsx,.xls"
          className="sr-only"
          aria-label={t('excel.file')}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? errorId : undefined}
          disabled={uploading}
          onChange={(e) => {
            pick(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </label>
      {error && (
        <p id={errorId} role="alert" className="-mt-2 text-[12.5px] text-danger">
          {error}
        </p>
      )}

      {hint && <p className="text-[12.5px] text-muted">{hint}</p>}

      {uploading && (
        <div
          role="progressbar"
          aria-label={t('excel.progress')}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          className="h-2 overflow-hidden rounded-full bg-surface-2"
        >
          <div className="h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      )}

      {onTemplate && (
        <Button
          variant="ghost"
          size="sm"
          className="justify-self-start"
          icon={<Download size={15} />}
          loading={template}
          onClick={downloadTemplate}
        >
          {t('excel.template')}
        </Button>
      )}
    </Modal>
  )
}
