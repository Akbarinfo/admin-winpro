import { useTranslation } from 'react-i18next'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Modal } from '@/shared/ui'

/** What the old panel told admins to paste into an AI to get a country's phone settings. */
const SAMPLE = `{
  code: "kz",
  phoneFormat: "+7 (###) ### ## ##",
  name: "Kazakhstan",
  phoneCode: "+7",
  length: 12,
  codeSlice: /^\\+7/,
  digitsLength: 10,
}`

/** «How to add a country» (CountryGuideModal in the old panel). */
export function CountryGuideDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()

  const copy = async () => {
    await navigator.clipboard?.writeText(SAMPLE)
    toast.success(t('countries.guide_copied'))
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={t('countries.guide_title')}
      footer={<Button onClick={onClose}>{t('countries.guide_ok')}</Button>}
    >
      <p>{t('countries.guide_intro')}</p>
      <ol className="list-decimal space-y-1.5 pl-5 text-muted">
        <li>{t('countries.guide_step_ai')}</li>
        <li>{t('countries.guide_step_country')}</li>
        <li>{t('countries.guide_step_paste')}</li>
        <li>{t('countries.guide_step_flag')}</li>
      </ol>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="font-medium">{t('countries.guide_sample')}</span>
          <Button size="sm" variant="outline" icon={<Copy size={14} />} onClick={copy}>
            {t('countries.guide_copy')}
          </Button>
        </div>
        <pre className="overflow-x-auto font-sans rounded-md border border-line bg-surface-2 p-3 text-xs leading-relaxed">
          {SAMPLE}
        </pre>
      </div>
    </Modal>
  )
}
