import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useLocation, useParams } from 'react-router'
import { useChosenId } from '@/shared/hooks/useChosenId'
import { ParameterPanel } from '@/shared/parameters'
import { BackLink, PageHeader } from '@/shared/ui'
import { AdditionalPanel } from './AdditionalPanel'
import { ADDITIONAL_PARAMETERS, insertApi, insertKeys, SPEC_PARAMETERS } from './api'
import { consistLabel } from './helpers'
import { SpecificationsPanel } from './SpecificationsPanel'

/** /inserts/layout/page/:id — a product's inserts and their specification (the old InsertsPageLayout). */
export function InsertPage() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  // Another insert drops the chosen specification row and the inner tables' pages
  // (the old page kept the previous specification's parameters on screen).
  const additional = useChosenId('additionalId', ['specId', 'specs', 'aparam', 'sparam'])
  const spec = useChosenId('specId', ['sparam'])

  // The list passes the name along (as the old page did); opened by a link, it is loaded.
  const passed = (useLocation().state as { name?: string } | null)?.name
  const consist = useQuery({
    queryKey: insertKeys.detail(id),
    queryFn: ({ signal }) => insertApi.get(id, signal),
    enabled: !passed,
  })
  const name = passed || (consist.data ? consistLabel(consist.data) : '')

  return (
    <div className="grid gap-4">
      <BackLink to="/inserts">{t('inserts.back')}</BackLink>
      <PageHeader title={t('inserts.open')} description={name || undefined} />

      <div className="grid gap-4 xl:grid-cols-2">
        <AdditionalPanel
          consistId={id}
          selectedId={additional.id}
          onSelect={additional.choose}
          onDeleted={additional.drop}
        />
        <ParameterPanel
          title={t('inserts.params')}
          endpoint={ADDITIONAL_PARAMETERS}
          parentId={additional.id}
          tableKey="aparam"
          hint={t('inserts.pick_additional')}
        />
        <SpecificationsPanel
          additionalId={additional.id}
          selectedId={spec.id}
          onSelect={spec.choose}
          onDeleted={spec.drop}
        />
        <ParameterPanel
          title={t('inserts.spec_params')}
          endpoint={SPEC_PARAMETERS}
          parentId={spec.id}
          tableKey="sparam"
          hint={t('inserts.pick_spec')}
        />
      </div>
    </div>
  )
}
