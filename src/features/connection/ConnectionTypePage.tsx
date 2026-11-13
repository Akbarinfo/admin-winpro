import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useParams } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { ParameterPanel } from '@/shared/parameters'
import { PageHeader } from '@/shared/ui'
import { connectionApi, connectionKeys, SPEC_PARAMETERS, TYPE_PARAMETERS } from './api'
import { connectionLabel } from './helpers'
import { SpecificationsPanel } from './SpecificationsPanel'
import { TypesPanel } from './TypesPanel'
import { useSelection } from './useSelection'

/** /connection/type/:id — a connection's variants and their specification (the old ConnectionType). */
export function ConnectionTypePage() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const { typeId, specId, chooseType, chooseSpec, dropType, dropSpec } = useSelection()

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
      <Link
        to="/connection"
        className="inline-flex w-fit items-center gap-1.5 text-muted hover:text-fg"
      >
        <ArrowLeft size={16} />
        {t('connection.back')}
      </Link>
      <PageHeader title={t('connection.variants')} description={name || undefined} />

      <div className="grid gap-4 xl:grid-cols-2">
        <TypesPanel
          connectionId={id}
          selectedId={typeId}
          onSelect={chooseType}
          onDeleted={dropType}
        />
        <ParameterPanel
          title={t('connection.type_params')}
          endpoint={TYPE_PARAMETERS}
          parentId={typeId}
          tableKey="tparam"
          hint={t('connection.spec.pick_type')}
        />
        <SpecificationsPanel
          typeId={typeId}
          selectedId={specId}
          onSelect={chooseSpec}
          onDeleted={dropSpec}
        />
        <ParameterPanel
          title={t('connection.spec_params')}
          endpoint={SPEC_PARAMETERS}
          parentId={specId}
          tableKey="sparam"
          hint={t('connection.pick_spec')}
        />
      </div>
    </div>
  )
}
