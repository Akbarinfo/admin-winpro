import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Field, Modal, Textarea } from '@/shared/ui'

/**
 * Why the Akfa products are ignored (the old ignore modal): the reason may stay empty.
 * One plain field, so plain state. It closes once `onIgnore` is done (its errors are toasted).
 */
export function IgnoreDialog({
  count,
  onIgnore,
  onClose,
}: {
  count: number
  onIgnore: (reason: string) => Promise<unknown>
  onClose: () => void
}) {
  const { t } = useTranslation()
  const id = useId()
  const [reason, setReason] = useState('')
  const [sending, setSending] = useState(false)

  const submit = async () => {
    setSending(true)
    try {
      await onIgnore(reason.trim())
    } finally {
      setSending(false)
      onClose()
    }
  }

  return (
    <Modal
      open
      size="sm"
      onClose={() => !sending && onClose()}
      title={
        count > 1
          ? t('akfa.newProducts.ignore_modal_title_bulk', { count })
          : t('akfa.newProducts.ignore_modal_title')
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={sending}>
            {t('common.cancel')}
          </Button>
          <Button onClick={submit} loading={sending}>
            {t('akfa.newProducts.ignore_button')}
          </Button>
        </>
      }
    >
      <Field label={t('akfa.newProducts.ignore_modal_title')} htmlFor={id}>
        <Textarea
          id={id}
          rows={3}
          autoFocus
          value={reason}
          placeholder={t('akfa.newProducts.ignore_reason_placeholder')}
          onChange={(e) => setReason(e.target.value)}
        />
      </Field>
    </Modal>
  )
}
