import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ChevronRight, Eraser, History } from 'lucide-react'
import { formatRelative } from '@/shared/lib/format'
import { useRecentPages } from '@/shared/store/recentPages'
import { useSession } from '@/shared/store/session'
import { Button, PageHeader } from '@/shared/ui'
import { NAV, type NavItem } from '../layout/nav'

/** Each menu path → its item and the title of its group. */
const SECTIONS = new Map<string, { item: NavItem; group: string }>(
  NAV.flatMap((g) => g.items.map((item) => [item.to, { item, group: g.title }] as const)),
)

/** «/» — the sections this user opened last (up to 10), each back where it was left. */
export function HomePage() {
  const { t } = useTranslation()
  const userKey = useSession((s) => s.user?.username ?? s.user?.email ?? '')
  const recent = useRecentPages((s) => s.byUser[userKey]) ?? []
  const clear = useRecentPages((s) => s.clear)
  // sections since removed from the menu are skipped
  const cards = recent.flatMap((page) => {
    const section = SECTIONS.get(page.section)
    return section ? [{ ...page, ...section }] : []
  })

  return (
    <>
      <PageHeader title={t('sidebar_menu_dashboard')} />

      <section aria-labelledby="recent-title" className="grid gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="recent-title" className="text-[17px] font-semibold">
              {t('home.recent_title')}
            </h2>
            <p className="text-muted">{t('home.recent_hint')}</p>
          </div>
          {cards.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              icon={<Eraser size={16} />}
              onClick={() => clear(userKey)}
            >
              {t('home.clear')}
            </Button>
          )}
        </div>

        {cards.length === 0 ? (
          <div className="grid place-items-center gap-2 rounded-lg border border-dashed border-line-strong bg-surface px-4 py-12 text-center">
            <History size={26} className="text-faint" aria-hidden="true" />
            <p className="font-medium">{t('home.empty_title')}</p>
            <p className="max-w-[44ch] text-muted">{t('home.empty_text')}</p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {cards.map(({ section, url, at, item, group }) => {
              const Icon = item.icon
              return (
                <li key={section}>
                  <Link
                    to={url}
                    className="group flex items-center gap-3 rounded-lg border border-line bg-surface p-3.5 transition-colors hover:border-primary hover:bg-primary-soft/40"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-primary-soft text-primary-strong">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{t(item.label)}</span>
                      <span className="block truncate text-[13px] text-muted">
                        {t(group)} · {formatRelative(at)}
                      </span>
                    </span>
                    <ChevronRight
                      size={18}
                      aria-hidden="true"
                      className="shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-primary-strong"
                    />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </>
  )
}
