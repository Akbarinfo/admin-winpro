import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'
import { Frame } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { useLastView } from '@/shared/store/tablePrefs'
import { NAV } from './nav'

/** @param onNavigate closes the mobile drawer after a link is chosen. */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation()
  const lastSearch = useLastView((s) => s.search)

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[60px] shrink-0 items-center gap-2.5 border-b border-line px-[18px] text-[17px] font-bold">
        <span className="grid size-[30px] place-items-center rounded-[9px] bg-primary text-white">
          <Frame size={17} aria-hidden="true" />
        </span>
        WinPro
        <span className="ml-auto rounded-md border border-line bg-surface-2 px-2 text-xs font-medium text-muted">
          admin
        </span>
      </div>

      <nav
        aria-label={t('layout.navigation')}
        className="grid gap-[18px] overflow-y-auto px-2.5 pt-3 pb-5"
      >
        {NAV.map((group) => (
          <div key={group.title}>
            <div className="px-2.5 pb-1.5 text-sm font-semibold tracking-[.08em] text-faint uppercase">
              {t(group.title)}
            </div>
            {group.items.map(({ to, label, icon: Icon, status }) =>
              // Not migrated yet: shown greyed out so it's clear what's left.
              !status ? (
                <span
                  key={to}
                  aria-disabled="true"
                  title={t('nav.not_migrated')}
                  className="flex h-[34px] cursor-not-allowed items-center gap-2.5 rounded-md px-2.5 font-medium text-muted opacity-45"
                >
                  <Icon size={18} aria-hidden="true" className="shrink-0" />
                  <span className="truncate">{t(label)}</span>
                </span>
              ) : (
                <NavLink
                  key={to}
                  // back where the section was left: its table's page, filters and search
                  to={{ pathname: to, search: lastSearch[to] ?? '' }}
                  end={to === '/'}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'flex h-[34px] items-center gap-2.5 rounded-md px-2.5 font-medium text-muted hover:bg-surface-2 hover:text-fg',
                      isActive &&
                        'bg-primary-soft text-primary-strong hover:bg-primary-soft hover:text-primary-strong',
                    )
                  }
                >
                  <Icon size={18} aria-hidden="true" className="shrink-0" />
                  <span className="truncate">{t(label)}</span>
                  {status === 'new' && (
                    <span className="ml-auto rounded-[5px] bg-primary px-1.5 py-px text-[10px] leading-4 font-semibold tracking-wide text-primary-fg">
                      {t('nav.new')}
                    </span>
                  )}
                </NavLink>
              ),
            )}
          </div>
        ))}
      </nav>
    </div>
  )
}
