import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'
import { ShieldCheck, Target, Zap, type LucideIcon } from 'lucide-react'
import { LanguageSwitch, Logo, ThemeToggle } from '@/shared/ui'

const VALUES: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Target, title: 'auth.value_accuracy_title', text: 'auth.value_accuracy_text' },
  { icon: Zap, title: 'auth.value_speed_title', text: 'auth.value_speed_text' },
  { icon: ShieldCheck, title: 'auth.value_trust_title', text: 'auth.value_trust_text' },
]

const YEAR = new Date().getFullYear()

/**
 * Every auth screen: the form on the left with the logo, language and theme above it; the brand
 * panel on the right (hidden on phones, so the form comes first there).
 */
export function AuthLayout() {
  const { t } = useTranslation()

  return (
    <div className="grid min-h-full md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <section className="flex min-h-full flex-col gap-8 px-4 py-5 md:px-10 md:py-7">
        <header className="flex flex-wrap items-center gap-x-3 gap-y-3">
          <Logo className="h-9 md:h-11" />
          <div className="ml-auto flex gap-2">
            <LanguageSwitch />
            <ThemeToggle bordered />
          </div>
        </header>

        <div className="grid flex-1 place-items-start md:place-items-center">
          <Outlet />
        </div>

        <footer className="text-[12.5px] text-faint">© {YEAR} WinPro</footer>
      </section>

      <section className="relative hidden flex-col justify-center overflow-hidden bg-linear-150 from-primary to-primary-strong p-10 text-white md:flex lg:p-14 dark:from-primary-soft dark:to-bg">
        <div className="relative z-10 max-w-120">
          <h1 className="text-[clamp(30px,3.2vw,42px)] leading-[1.1] font-semibold tracking-tight text-balance">
            {t('auth.brand_title')}
          </h1>
          <p className="mt-4 max-w-[44ch] text-base leading-relaxed opacity-90">
            {t('auth.brand_text')}
          </p>
          <ul className="mt-8 grid gap-4.5">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="grid size-9.5 shrink-0 place-items-center rounded-[10px] bg-white/15">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <div>
                  <b className="block text-[15px] font-semibold">{t(title)}</b>
                  <span className="block text-[13.5px] opacity-80">{t(text)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <WindowArt />
      </section>
    </div>
  )
}

/** Decorative two-sash window drawing with dimensions. */
function WindowArt() {
  return (
    <svg
      viewBox="0 0 440 420"
      fill="none"
      stroke="#fff"
      aria-hidden="true"
      className="pointer-events-none absolute right-[-4%] bottom-[4%] w-[46%] max-w-105 opacity-15"
    >
      <g strokeWidth="3">
        <rect x="40" y="20" width="360" height="340" />
        <rect x="56" y="36" width="328" height="308" />
        <path d="M220 36v308" />
      </g>
      <g strokeWidth="2">
        <rect x="70" y="50" width="136" height="280" />
        <rect x="234" y="50" width="136" height="280" />
      </g>
      <g strokeWidth="1.5" strokeDasharray="6 6">
        <path d="M70 50 206 190 70 330" />
        <path d="M234 330 302 50 370 330" />
      </g>
      <g strokeWidth="1.2">
        <path d="M40 392h360M40 384v16M400 384v16M24 20v340M16 20h16M16 360h16" />
      </g>
    </svg>
  )
}
