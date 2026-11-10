import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useNavigation } from 'react-router'
import { Menu } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { IconButton, LanguageSwitch, ThemeToggle } from '@/shared/ui'
import { Sidebar } from './Sidebar'
import { UserMenu } from './UserMenu'

export function AppLayout() {
  const { t } = useTranslation()
  const [navOpen, setNavOpen] = useState(false)
  const closeNav = () => setNavOpen(false)
  // A section's page loads on its first visit: the current page stays until it's there.
  const loadingPage = useNavigation().state === 'loading'

  return (
    <div className="grid h-dvh lg:grid-cols-[260px_minmax(0,1fr)]">
      {/* Below lg the sidebar is an off-canvas drawer. */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[280px] max-w-[86%] border-r border-line bg-surface transition-transform duration-200',
          'lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-auto lg:max-w-none lg:translate-x-0',
          navOpen ? 'translate-x-0' : '-translate-x-[105%]',
        )}
      >
        <Sidebar onNavigate={closeNav} />
      </aside>
      {navOpen && (
        <div
          className="fixed inset-0 z-45 bg-overlay lg:hidden"
          onClick={closeNav}
          aria-hidden="true"
        />
      )}

      <div className="relative flex min-h-0 min-w-0 flex-col">
        {loadingPage && (
          <div
            role="progressbar"
            aria-label={t('common.loading')}
            className="absolute inset-x-0 top-0 z-30 h-0.5 animate-pulse bg-primary"
          />
        )}
        <header className="z-20 flex h-[60px] shrink-0 items-center gap-2.5 border-b border-line bg-surface px-4">
          <IconButton
            label={t('layout.open_menu')}
            onClick={() => setNavOpen(true)}
            className="lg:hidden"
          >
            <Menu size={18} />
          </IconButton>
          <div className="ml-auto flex items-center gap-1.5">
            <LanguageSwitch className="hidden sm:inline-flex" />
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>
        {/* Scrolls on its own. A list page fills it (h-full) and lets only the table body scroll. */}
        <main className="min-h-0 min-w-0 flex-1 overflow-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
