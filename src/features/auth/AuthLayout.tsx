import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'
import { Frame, Globe, Plug, type LucideIcon } from 'lucide-react'
import { LanguageSwitch, ThemeToggle } from '@/shared/ui'

const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Frame, title: 'auth.feat_catalog_title', text: 'auth.feat_catalog_text' },
  { icon: Globe, title: 'auth.feat_prices_title', text: 'auth.feat_prices_text' },
  { icon: Plug, title: 'auth.feat_akfa_title', text: 'auth.feat_akfa_text' },
]

const YEAR = new Date().getFullYear()

export function AuthLayout() {
  const { t } = useTranslation()

  return (
    <div className="grid min-h-full md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <section className="relative flex flex-col justify-between gap-5 overflow-hidden bg-linear-150 from-[#37a0ad] to-[#1d6f7a] px-4 py-7 text-white md:gap-10 md:p-10 dark:from-[#2a8794] dark:to-[#0f4a52]">
        <div className="relative z-10 flex items-center gap-2.5 text-xl font-bold">
          <span className="grid size-[34px] place-items-center rounded-[9px] bg-white/15">
            <Frame size={20} aria-hidden="true" />
          </span>
          WinPro
          <span className="rounded-md bg-white/15 px-2 py-0.5 text-[11px] font-semibold tracking-[.08em] uppercase">
            Admin
          </span>
        </div>

        <div className="relative z-10">
          <h1 className="max-w-[16ch] text-2xl leading-tight font-semibold tracking-tight text-balance md:text-[clamp(28px,3.4vw,42px)]">
            {t('auth.brand_title')}
          </h1>
          <p className="mt-3.5 max-w-[42ch] text-[15px] opacity-85">{t('auth.brand_text')}</p>
          <ul className="mt-7 hidden max-w-[400px] gap-4 md:grid">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-white/15">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <div>
                  <b className="block text-[14.5px] font-semibold">{t(title)}</b>
                  <span className="block text-[13px] opacity-80">{t(text)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 hidden justify-between gap-4 text-[12.5px] opacity-75 md:flex">
          <span>© {YEAR} WinPro</span>
        </div>

        <WindowArt />
      </section>

      <section className="relative grid place-items-start gap-4 px-4 py-8 md:place-items-center">
        <div className="flex gap-2 justify-self-end md:absolute md:top-5 md:right-5">
          <LanguageSwitch />
          <ThemeToggle bordered />
        </div>
        <Outlet />
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
      className="pointer-events-none absolute right-[-2%] bottom-[7%] hidden w-1/2 max-w-[440px] opacity-20 md:block"
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
      <g fill="#fff" stroke="none" fontFamily="Inter, sans-serif" fontSize="14" textAnchor="middle">
        <text x="220" y="414">
          1400
        </text>
        <text transform="translate(12 190) rotate(-90)">1200</text>
      </g>
    </svg>
  )
}
