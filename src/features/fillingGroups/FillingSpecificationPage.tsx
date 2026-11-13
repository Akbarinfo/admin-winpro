import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useLocation, useParams } from 'react-router'
import { useChosenId } from '@/shared/hooks/useChosenId'
import { ParameterPanel } from '@/shared/parameters'
import { BackLink, PageHeader } from '@/shared/ui'
import { fillingApi, fillingKeys, SPEC_PARAMETERS } from './api'
import { SpecificationsPanel } from './SpecificationsPanel'

/** /filling/specification/:id — a group's products and their parameters (the old FillingForm). */
export function FillingSpecificationPage() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const spec = useChosenId('specId', ['sparam'])

  // The list passes the name along (as the old page did); opened by a link, it is loaded.
  const passed = (useLocation().state as { name?: string } | null)?.name
  const group = useQuery({
    queryKey: fillingKeys.detail(id),
    queryFn: ({ signal }) => fillingApi.get(id, signal),
    enabled: !passed,
  })
  const name = passed || group.data?.name || ''

  return (
    <div className="grid gap-4">
      <BackLink to="/filling">{t('fillingGroups.back')}</BackLink>
      <PageHeader title={t('fillingGroups.open')} description={name || undefined} />

      <div className="grid gap-4 xl:grid-cols-2">
        <SpecificationsPanel
          groupId={id}
          selectedId={spec.id}
          onSelect={spec.choose}
          onDeleted={spec.drop}
        />
        <ParameterPanel
          title={t('fillingGroups.spec_params')}
          endpoint={SPEC_PARAMETERS}
          parentId={spec.id}
          tableKey="sparam"
          hint={t('fillingGroups.pick_spec')}
        />
      </div>
    </div>
  )
}
