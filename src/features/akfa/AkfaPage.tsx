import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { PageHeader, Tabs } from '@/shared/ui'
import { ListenerState, SummaryCards } from './AkfaSummary'
import { NewProductsTab } from './NewProductsTab'
import { useAkfaSummary } from './useAkfaSummary'

const TABS = ['new', 'prices', 'mapping', 'log'] as const
type Tab = (typeof TABS)[number]
const TAB_LABELS: Record<Tab, string> = {
  new: 'akfa.tabs.new_products',
  prices: 'akfa.tabs.price_changes',
  mapping: 'akfa.tabs.mapping',
  log: 'akfa.tabs.log_settings',
}

/** /integrations/akfa (the old AkfaIntegrationLayout): the summary and four tabs; the tab is in the URL. */
export function AkfaPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const param = searchParams.get('tab')
  const tab: Tab = TABS.find((x) => x === param) ?? 'new'
  const { summary, counts } = useAkfaSummary()

  return (
    // the page fills <main>; the tab's table scrolls inside its card (as list pages do)
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader title={t('akfa.title')} description={<ListenerState summary={summary} />} />
      <SummaryCards counts={counts} />
      <Tabs
        id="akfa-tabs"
        label={t('akfa.title')}
        value={tab}
        // another tab starts from its own defaults: the old tabs kept no filters either
        onChange={(next) => setSearchParams(next === 'new' ? {} : { tab: next }, { replace: true })}
        items={TABS.map((value) => ({ value, label: t(TAB_LABELS[value]) }))}
        className="min-h-0 flex-1"
        panelClassName="flex flex-col pt-4"
      >
        <div className="flex min-h-0 flex-1 flex-col">
          {tab === 'new' ? (
            <NewProductsTab />
          ) : (
            <p className="py-10 text-center text-muted">{t('akfa.step_later')}</p>
          )}
        </div>
      </Tabs>
    </div>
  )
}
