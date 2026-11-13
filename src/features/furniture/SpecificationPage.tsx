import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useParams } from 'react-router'
import { Copy, CopyPlus } from 'lucide-react'
import { useConfirmCopy } from '@/shared/hooks/useConfirmCopy'
import { ParameterPanel } from '@/shared/parameters'
import { BackLink, IconButton, PageHeader } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import { furnitureApi, furnitureKeys, SPEC_PARAMETERS, SPEC_TABS, type SpecTab } from './api'
import { CopyToAccessoryDialog } from './CopyToAccessoryDialog'
import { LimitsPanel } from './LimitsPanel'
import { SpecDialog } from './SpecDialog'
import { SpecTablePanel, WaitingPanel } from './SpecTablePanel'
import type { AccessorySpecification } from './types'
import { useSpecSelection } from './useSpecSelection'

const specName = (row: AccessorySpecification) =>
  [row.article, row.productName].filter(Boolean).join(' — ')

/**
 * /furniture/main/specification/:id — an accessory's specification (the old
 * AccessoriesSpecificationLayout): main/track rows → their dependent rows → those rows' inner
 * rows; the side limits and parameters follow the last row clicked on any level.
 */
export function FurnitureSpecificationPage() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const accessoryId = Number(id)
  const sel = useSpecSelection()
  const [copyTo, setCopyTo] = useState<AccessorySpecification | null>(null)

  // The list passes the name along (as the old page did); opened by a link, it is loaded.
  const passed = (useLocation().state as { name?: string } | null)?.name
  const accessory = useQuery({
    queryKey: furnitureKeys.detail(id),
    queryFn: ({ signal }) => furnitureApi.get(id, signal),
    enabled: !passed,
  })
  const name = passed || accessory.data?.name || ''

  const tab = sel.tab
  const copy = useConfirmCopy<AccessorySpecification>({
    copy: (row) => furnitureApi.copyMainSpec(tab, row.id),
    invalidate: furnitureKeys.specs,
    getName: specName,
  })

  const tabSwitch = (
    <div
      role="group"
      aria-label={t('furniture.open')}
      className="flex rounded-md border border-line p-0.5"
    >
      {(Object.keys(SPEC_TABS) as SpecTab[]).map((key) => (
        <button
          key={key}
          type="button"
          aria-pressed={tab === key}
          onClick={() => tab !== key && sel.setTab(key)}
          className={cn(
            'h-[26px] rounded px-2.5 text-[13px]',
            tab === key
              ? 'bg-primary-soft font-medium text-primary-strong'
              : 'text-muted hover:text-fg',
          )}
        >
          {t(key === 'main' ? 'furniture.spec.main' : 'furniture.spec.track')}
        </button>
      ))}
    </div>
  )

  const targetId = sel.target?.id ?? null

  return (
    <div className="grid gap-4">
      <BackLink to="/furniture">{t('furniture.back')}</BackLink>
      <PageHeader title={t('furniture.open')} description={name || undefined} />

      <div className="grid gap-4 xl:grid-cols-2">
        <SpecTablePanel
          key={tab}
          title={t(tab === 'main' ? 'furniture.spec.main' : 'furniture.spec.track')}
          headerExtra={tabSwitch}
          tableKey="main"
          queryKey={furnitureKeys.level(tab)}
          fetchPage={(body, signal) => furnitureApi.mainSpecs(tab, body, signal)}
          filter={{ accessoriesId: id }}
          remove={(row) => furnitureApi.removeMainSpec(tab, row.id)}
          selectedId={sel.target?.level === 'main' ? sel.target.id : sel.mainId}
          onSelect={(rowId) => sel.choose('main', rowId)}
          onDeleted={(rowId) => sel.drop('main', rowId)}
          showDefault
          extraActions={(row) => (
            <>
              <IconButton label={t('common.copy')} onClick={() => copy.request(row)}>
                <Copy size={16} />
              </IconButton>
              <IconButton label={t('furniture.spec.copy_to')} onClick={() => setCopyTo(row)}>
                <CopyPlus size={16} />
              </IconButton>
            </>
          )}
          dialog={(rowId, onClose) => (
            <SpecDialog
              title={t(tab === 'main' ? 'furniture.spec.add_main' : 'furniture.spec.add_track')}
              queryKey={furnitureKeys.level(tab)}
              id={rowId}
              fetchOne={(specId, signal) => furnitureApi.mainSpec(tab, specId, signal)}
              save={(values, specId) => furnitureApi.saveMainSpec(tab, id, values, specId)}
              showDefault={SPEC_TABS[tab].showDefault}
              onClose={onClose}
            />
          )}
        />

        <div className="grid gap-4">
          {sel.mainId === null ? (
            <WaitingPanel title={t('furniture.spec.depend')} hint={t('furniture.spec.pick_main')} />
          ) : (
            <SpecTablePanel
              key={`depend-${sel.mainId}`}
              title={t('furniture.spec.depend')}
              tableKey="depend"
              queryKey={furnitureKeys.level('depend')}
              fetchPage={furnitureApi.dependSpecs}
              filter={{ specificationId: sel.mainId }}
              remove={(row) => furnitureApi.removeDependSpec(row.id)}
              selectedId={sel.dependId}
              onSelect={(rowId) => sel.choose('depend', rowId)}
              onDeleted={(rowId) => sel.drop('depend', rowId)}
              dialog={(rowId, onClose) => (
                <SpecDialog
                  title={t('furniture.spec.add_depend')}
                  queryKey={furnitureKeys.level('depend')}
                  id={rowId}
                  fetchOne={furnitureApi.dependSpec}
                  save={(values, specId) =>
                    furnitureApi.saveDependSpec(sel.mainId!, id, values, specId)
                  }
                  onClose={onClose}
                />
              )}
            />
          )}

          {sel.dependId === null ? (
            <WaitingPanel
              title={t('furniture.spec.inner')}
              hint={t('furniture.spec.pick_depend')}
            />
          ) : (
            <SpecTablePanel
              key={`inner-${sel.dependId}`}
              title={t('furniture.spec.inner')}
              tableKey="inner"
              queryKey={furnitureKeys.level('inner')}
              fetchPage={furnitureApi.innerSpecs}
              filter={{ specificationId: sel.dependId }}
              remove={(row) => furnitureApi.removeInnerSpec(row.id)}
              selectedId={sel.target?.level === 'inner' ? sel.target.id : null}
              onSelect={(rowId) => sel.choose('inner', rowId)}
              onDeleted={(rowId) => sel.drop('inner', rowId)}
              dialog={(rowId, onClose) => (
                <SpecDialog
                  title={t('furniture.spec.add_inner')}
                  queryKey={furnitureKeys.level('inner')}
                  id={rowId}
                  fetchOne={furnitureApi.innerSpec}
                  save={(values, specId) =>
                    furnitureApi.saveInnerSpec(sel.dependId!, values, specId)
                  }
                  onClose={onClose}
                />
              )}
            />
          )}
        </div>

        {targetId === null ? (
          <WaitingPanel title={t('furniture.spec.limits')} hint={t('furniture.spec.pick_row')} />
        ) : (
          <LimitsPanel key={sel.target!.level + targetId} specId={targetId} />
        )}
        <ParameterPanel
          key={sel.target?.level}
          title={t('furniture.spec.params')}
          endpoint={SPEC_PARAMETERS}
          parentId={targetId}
          tableKey="param"
          hint={t('furniture.spec.pick_row')}
        />
      </div>

      {copy.dialog}
      {copyTo && (
        <CopyToAccessoryDialog
          tab={tab}
          accessoryId={accessoryId}
          row={copyTo}
          onClose={() => setCopyTo(null)}
        />
      )}
    </div>
  )
}
