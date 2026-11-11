import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Field, Modal, Textarea } from '@/shared/ui'

/**
 * Asks why requests are rejected; the reason is required (the old page warned when empty).
 * One plain field, so plain state rather than useEntityForm. If `onReject` throws, the dialog stays open.
 */
export function RejectDialog({
  count,
  onReject,
  onClose,
}: {
  /** More than one — a bulk rejection. */
  count: number
  onReject: (reason: string) => Promise<unknown>
  onClose: () => void
}) {
  const { t } = useTranslation()
  const id = useId()
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string>()
  const [sending, setSending] = useState(false)

  const submit = async () => {
    const text = reason.trim()
    if (!text) return setError('validation.required')
    setSending(true)
    try {
      await onReject(text)
      onClose()
    } catch {
      // Not rejected: the error is shown by the page; keep the reason for another try.
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal
      open
      size="sm"
      onClose={() => !sending && onClose()}
      title={
        count > 1
          ? t('priceRequests.reject_all_modal_title', { count })
          : t('priceRequests.reject_modal_title')
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={sending}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={submit} loading={sending}>
            {t('priceRequests.reject')}
          </Button>
        </>
      }
    >
      <Field label={t('priceRequests.reject_reason')} htmlFor={id} error={error} required>
        <Textarea
          id={id}
          rows={4}
          autoFocus
          value={reason}
          invalid={!!error}
          placeholder={t('priceRequests.reject_reason_placeholder')}
          onChange={(e) => {
            setReason(e.target.value)
            setError(undefined)
          }}
        />
      </Field>
    </Modal>
  )
}
