import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/cn'
import { LANGS, usePreferences } from '@/shared/store/preferences'

export function LanguageSwitch({ className }: { className?: string }) {
  const { t } = useTranslation()
  const lang = usePreferences((s) => s.lang)
  const setLang = usePreferences((s) => s.setLang)

  return (
    <div
      role="group"
      aria-label={t('layout.language')}
      className={cn('inline-flex rounded-md border border-line bg-surface p-0.5', className)}
    >
      {LANGS.map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={lang === value}
          onClick={() => setLang(value)}
          className={cn(
            'rounded-[6px] px-2.5 py-1 text-[12.5px] font-medium text-muted uppercase',
            lang === value && 'bg-primary-soft text-primary-strong',
          )}
        >
          {value}
        </button>
      ))}
    </div>
  )
}
