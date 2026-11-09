import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Cropper from 'react-easy-crop'
import { ZoomIn, ZoomOut } from 'lucide-react'
import { useObjectUrl } from '@/shared/hooks/useObjectUrl'
import { cropImage, type CropArea } from '@/shared/lib/cropImage'
import { cn } from '@/shared/lib/cn'
import { Button } from './Button'
import { Modal } from './Modal'

const CROP_ASPECTS = [
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
]

type ImageCropDialogProps = {
  file: File
  /** Starting aspect ratio; the user can switch to another one. */
  aspect?: number
  /** The image to upload: cropped, or the original. */
  onDone: (file: File) => void
  onCancel: () => void
}

/** Crop a chosen image before upload, or upload it as is. Replaces the old ImageCropModal (1:1 only). */
export function ImageCropDialog({
  file,
  aspect: initialAspect = 1,
  onDone,
  onCancel,
}: ImageCropDialogProps) {
  const { t } = useTranslation()
  const src = useObjectUrl(file)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [aspect, setAspect] = useState(initialAspect)
  const [area, setArea] = useState<CropArea | null>(null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  const apply = async () => {
    if (!area) return
    setBusy(true)
    try {
      onDone(await cropImage(file, area))
    } catch {
      setFailed(true)
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={onCancel}
      title={t('crop.title')}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={busy} className="mr-auto">
            {t('common.cancel')}
          </Button>
          <Button variant="outline" onClick={() => onDone(file)} disabled={busy}>
            {t('crop.original')}
          </Button>
          <Button onClick={apply} loading={busy} disabled={!area}>
            {t('crop.apply')}
          </Button>
        </>
      }
    >
      <div className="relative h-[min(55vh,400px)] overflow-hidden rounded-md bg-[repeating-conic-gradient(var(--surface-2)_0_25%,var(--line)_0_50%)] bg-[length:16px_16px]">
        {src && (
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setArea(pixels)}
            objectFit="contain"
          />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div
          role="group"
          aria-label={t('crop.aspect')}
          className="inline-flex rounded-md border border-line bg-surface p-0.5"
        >
          {CROP_ASPECTS.map((a) => (
            <button
              key={a.label}
              type="button"
              aria-pressed={aspect === a.value}
              onClick={() => setAspect(a.value)}
              className={cn(
                'rounded-[6px] px-2.5 py-1 text-[12.5px] font-medium text-muted tabular-nums',
                aspect === a.value && 'bg-primary-soft text-primary-strong',
              )}
            >
              {a.label}
            </button>
          ))}
        </div>

        <label className="flex min-w-48 flex-1 items-center gap-2 text-muted sm:max-w-72">
          <ZoomOut size={16} aria-hidden="true" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            aria-label={t('crop.zoom')}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <ZoomIn size={16} aria-hidden="true" />
        </label>
      </div>

      {failed && <p className="text-xs text-danger">{t('crop.failed')}</p>}
    </Modal>
  )
}
