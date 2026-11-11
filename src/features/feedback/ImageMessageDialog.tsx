import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isClientError } from '@/shared/api/errors'
import { Alert, Button, Field, ImageUpload, Modal, Textarea } from '@/shared/ui'

/** Send a picture with an optional caption (the old «Send an image» modal). */
export function ImageMessageDialog({
  onClose,
  onSend,
}: {
  onClose: () => void
  onSend: (file: File, caption: string) => Promise<unknown>
}) {
  const { t } = useTranslation()
  const captionId = useId()
  const [file, setFile] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = async () => {
    if (!file) return
    setSending(true)
    setError(null)
    try {
      await onSend(file, caption.trim())
      onClose()
    } catch (e) {
      // A 4xx is shown here and the dialog stays for another try; 5xx is toasted by the API client.
      if (isClientError(e)) setError(e.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal
      open
      onClose={() => !sending && onClose()}
      title={t('feedback.send_image')}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={sending}>
            {t('common.cancel')}
          </Button>
          <Button onClick={send} loading={sending} disabled={!file}>
            {t('feedback.send')}
          </Button>
        </>
      }
    >
      {error && <Alert>{error}</Alert>}
      {/* Only the caption is sent with a picture; the old page fell back to the message box's text. */}
      <Field label={t('feedback.image')} htmlFor={`${captionId}-image`} required>
        <ImageUpload id={`${captionId}-image`} value={file} onChange={setFile} crop={false} />
      </Field>
      <Field label={t('feedback.caption')} htmlFor={captionId}>
        <Textarea
          id={captionId}
          rows={3}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          disabled={!file}
        />
      </Field>
    </Modal>
  )
}
