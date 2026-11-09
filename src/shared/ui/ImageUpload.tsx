import { useId, useState, type Ref } from 'react'
import { useTranslation } from 'react-i18next'
import { ImageUp, X } from 'lucide-react'
import { useObjectUrl } from '@/shared/hooks/useObjectUrl'
import { cn } from '@/shared/lib/cn'
import { ImageCropDialog } from './ImageCropDialog'

type ImageUploadProps = {
  id?: string
  /** Newly chosen file; null — keep the current image. */
  value: File | null
  onChange: (file: File | null) => void
  /** Image already saved on the server (fileUrl(...)). */
  currentUrl?: string
  /** Max size in MB (the old panel promised 10). */
  maxSizeMb?: number
  invalid?: boolean
  /** Offer cropping after a file is chosen (the user can still upload the original). */
  crop?: boolean
  /** Starting crop ratio: 1 for logos, 4 / 3 for photos… */
  cropAspect?: number
  ref?: Ref<HTMLInputElement>
}

/** Image picker with preview and drag-and-drop. Replaces the old «Загрузить файл или перетащите» blocks. */
export function ImageUpload({
  id: idProp,
  value,
  onChange,
  currentUrl,
  maxSizeMb = 10,
  invalid,
  crop = true,
  cropAspect = 1,
  ref,
}: ImageUploadProps) {
  const { t } = useTranslation()
  const autoId = useId()
  const id = idProp ?? autoId
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [broken, setBroken] = useState(false)
  /** Chosen, waiting in the crop dialog. */
  const [pending, setPending] = useState<File | null>(null)

  // Preview of the chosen file.
  const preview = useObjectUrl(value)

  const pick = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return setError(t('upload.not_image'))
    if (file.size > maxSizeMb * 1024 * 1024)
      return setError(t('upload.too_big', { size: maxSizeMb }))
    setError(null)
    setBroken(false)
    if (crop) setPending(file)
    else onChange(file)
  }

  const shown = preview ?? (broken ? undefined : currentUrl)

  return (
    <div className="grid gap-1.5">
      <label
        htmlFor={id}
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
          'flex cursor-pointer items-center gap-4 rounded-lg border-[1.5px] border-dashed border-line-strong bg-surface-2 p-3 transition-colors',
          'hover:border-primary focus-within:border-primary',
          dragging && 'border-primary bg-primary-soft',
          (invalid || error) && 'border-danger',
        )}
      >
        <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-md border border-line bg-surface text-faint">
          {shown ? (
            <img
              src={shown}
              alt=""
              className="size-full object-contain"
              onError={() => setBroken(true)}
            />
          ) : (
            <ImageUp size={24} aria-hidden="true" />
          )}
        </span>
        <span className="grid min-w-0 gap-0.5 text-[13px]">
          <span className="font-medium text-primary-strong">
            {value ? value.name : t(shown ? 'upload.replace' : 'upload.choose')}
          </span>
          <span className="text-xs text-faint">{t('upload.hint', { size: maxSizeMb })}</span>
        </span>
        {value && (
          <button
            type="button"
            aria-label={t('upload.undo')}
            title={t('upload.undo')}
            onClick={(e) => {
              e.preventDefault()
              onChange(null)
            }}
            className="ml-auto grid size-8 shrink-0 place-items-center rounded-md text-muted hover:bg-surface hover:text-fg"
          >
            <X size={16} />
          </button>
        )}
        <input
          ref={ref}
          id={id}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            pick(e.target.files?.[0])
            e.target.value = '' // allow choosing the same file again
          }}
        />
      </label>
      {error && <span className="text-xs text-danger">{error}</span>}
      {pending && (
        <ImageCropDialog
          file={pending}
          aspect={cropAspect}
          onDone={(file) => {
            setPending(null)
            onChange(file)
          }}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  )
}
