import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useLocation, useParams } from 'react-router'
import { useChosenId } from '@/shared/hooks/useChosenId'
import { ParameterPanel } from '@/shared/parameters'
import { BackLink, PageHeader } from '@/shared/ui'
import { connectionApi, connectionKeys, SPEC_PARAMETERS, TYPE_PARAMETERS } from './api'
import { connectionLabel } from './helpers'
import { SpecificationsPanel } from './SpecificationsPanel'
import { TypesPanel } from './TypesPanel'

/** /connection/type/:id — a connection's variants and their specification (the old ConnectionType). */
export function ConnectionTypePage() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  // Another variant drops the chosen specification row and the inner tables' pages.
  const type = useChosenId('typeId', ['specId', 'specs', 'tparam', 'sparam'])
  const spec = useChosenId('specId', ['sparam'])

  // The list passes the name along (as the old page did); opened by a link, it is loaded.
  const passed = (useLocation().state as { name?: string } | null)?.name
  const connection = useQuery({
    queryKey: [...connectionKeys.all, 'detail', id],
    queryFn: ({ signal }) => connectionApi.get(id, signal),
    enabled: !passed,
  })
  const name = passed || (connection.data ? connectionLabel(connection.data) : '')

  return (
    <div className="grid gap-4">
      <BackLink to="/connection">{t('connection.back')}</BackLink>
      <PageHeader title={t('connection.variants')} description={name || undefined} />

      <div className="grid gap-4 xl:grid-cols-2">
        <TypesPanel
          connectionId={id}
          selectedId={type.id}
          onSelect={type.choose}
          onDeleted={type.drop}
        />
        <ParameterPanel
          title={t('connection.type_params')}
          endpoint={TYPE_PARAMETERS}
          parentId={type.id}
          tableKey="tparam"
          hint={t('connection.spec.pick_type')}
        />
        <SpecificationsPanel
          typeId={type.id}
          selectedId={spec.id}
          onSelect={spec.choose}
          onDeleted={spec.drop}
        />
        <ParameterPanel
          title={t('connection.spec_params')}
          endpoint={SPEC_PARAMETERS}
          parentId={spec.id}
          tableKey="sparam"
          hint={t('connection.pick_spec')}
        />
      </div>
    </div>
  )
}
