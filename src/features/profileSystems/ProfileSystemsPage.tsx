import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { ChevronsDownUp, ChevronsUpDown, Layers3, Pencil, Plus, Trash2 } from 'lucide-react'
import { useConfirmDelete } from '@/shared/hooks/useConfirmDelete'
import { useServerTable } from '@/shared/hooks/useServerTable'
import { useTableFilters } from '@/shared/hooks/useTableFilters'
import { useFillingArticles, useFillingGroups } from '@/shared/lookups/fillings'
import { useProfileSystemTree } from '@/shared/lookups/profileSystems'
import { Alert, Button, Card, IconButton, SearchInput, Spinner, Tabs } from '@/shared/ui'
import {
  profileSystemApi,
  profileSystemKeys,
  specificationApi,
  specificationKeys,
  systemAccessoryApi,
  systemAccessoryKeys,
} from './api'
import { SpecificationTab } from './SpecificationTab'
import { SystemAccessoriesTab } from './SystemAccessoriesTab'
import { SystemFormDialog } from './SystemFormDialog'
import { SystemTree } from './SystemTree'
import { branchIds, filterTree, findNode, pathTo } from './tree'
import type { SpecificationRow, SystemAccessoryRow } from './types'

const TABS = ['spec', 'accessories', 'filling'] as const
type Tab = (typeof TABS)[number]
/** URL prefixes of the tabs' tables: ?spec.page=2&spec.supplierId=4&acc.q=… */
const TABLE_KEYS = ['spec', 'acc']
const SPEC_FILTERS = { supplierId: 'number' } as const

/**
 * Profile systems (the old ProfileSystemPageLayout): the tree on the left; the chosen system on
 * the right, its parts in tabs. The chosen system and tab are in the URL (?system=<id>&tab=…).
 */
export function ProfileSystemsPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = Number(searchParams.get('system')) || null
  const tabParam = searchParams.get('tab')
  const tab: Tab = TABS.find((x) => x === tabParam) ?? 'spec'
  const setParam = (key: string, value: string | null) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value === null) next.delete(key)
        else next.set(key, value)
        return next
      },
      { replace: true },
    )
  // Another system: its tables start from page 1, unfiltered — the old one's page may not exist.
  const select = (id: number | null) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const key of [...next.keys()]) {
          if (TABLE_KEYS.some((table) => key.startsWith(`${table}.`))) next.delete(key)
        }
        if (id === null) next.delete('system')
        else next.set('system', String(id))
        return next
      },
      { replace: true },
    )

  const tree = useProfileSystemTree()
  const nodes = useMemo(() => tree.data ?? [], [tree.data])
  const [query, setQuery] = useState('')
  const shown = useMemo(() => filterTree(nodes, query), [nodes, query])

  // The branches open: at first the way to a system chosen by a link.
  const [expanded, setExpanded] = useState<ReadonlySet<number>>(new Set())
  const [openedFor, setOpenedFor] = useState<number | null>(null)
  if (tree.data && selectedId !== null && openedFor !== selectedId) {
    setOpenedFor(selectedId)
    setExpanded((prev) => new Set([...prev, ...(pathTo(tree.data!, selectedId) ?? [])]))
  }
  const allBranches = branchIds(nodes)
  const allOpen = allBranches.length > 0 && allBranches.every((id) => expanded.has(id))
  const toggle = (id: number, open: boolean) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (open) next.add(id)
      else next.delete(id)
      return next
    })
  // While searching, every branch left is open: the matches are what's looked for.
  const searching = query.trim() !== ''
  const shownExpanded = useMemo(
    () => (searching ? new Set(branchIds(shown)) : expanded),
    [searching, shown, expanded],
  )

  // null — closed; 'new' — adding; 'edit' — the chosen system.
  const [dialog, setDialog] = useState<'new' | 'edit' | null>(null)

  const del = useConfirmDelete<number>({
    // Unchoose before the lists refresh, so the deleted system's details aren't asked for again.
    remove: (id) => profileSystemApi.remove(id).then(() => select(null)),
    invalidate: profileSystemKeys.all,
  })

  const parentPath =
    selectedId === null
      ? ''
      : (pathTo(nodes, selectedId) ?? []).map((id) => findNode(nodes, id)?.name).join(' / ')

  // Two cards side by side, each as tall as its content; on a wide screen neither grows past the
  // window — the tree and the tab's table scroll inside their cards.
  return (
    <div className="grid gap-4 lg:h-full lg:min-h-0 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
      <Card
        role="region"
        aria-labelledby="ps-title"
        className="flex min-h-0 flex-col overflow-hidden max-lg:max-h-105 lg:max-h-full"
      >
        <div className="grid gap-2.5 border-b border-line p-3.5">
          <h1 id="ps-title" className="text-base font-semibold">
            {t('profileSystems.title')}
          </h1>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              aria-label={t('profileSystems.add')}
              title={t('profileSystems.add')}
              icon={<Plus size={16} />}
              onClick={() => setDialog('new')}
            >
              {t('common.add')}
            </Button>
            <IconButton
              bordered
              className="ml-auto"
              label={t(allOpen ? 'profileSystems.collapse' : 'profileSystems.expand')}
              disabled={allBranches.length === 0 || searching}
              onClick={() => setExpanded(allOpen ? new Set() : new Set(allBranches))}
            >
              {allOpen ? <ChevronsDownUp size={16} /> : <ChevronsUpDown size={16} />}
            </IconButton>
          </div>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={t('profileSystems.search')}
            minLength={1}
            delay={150}
            className="max-w-none"
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
          {tree.isPending ? (
            <div className="grid place-items-center py-10 text-primary">
              <Spinner />
            </div>
          ) : tree.error ? (
            <Alert>{t('common.load_error')}</Alert>
          ) : nodes.length === 0 ? (
            <p className="p-3 text-muted">{t('profileSystems.empty')}</p>
          ) : shown.length === 0 ? (
            <p className="p-3 text-muted">{t('profileSystems.not_found')}</p>
          ) : (
            <SystemTree
              label={t('profileSystems.title')}
              nodes={shown}
              selectedId={selectedId}
              onSelect={select}
              expanded={shownExpanded}
              onToggle={toggle}
            />
          )}
        </div>
      </Card>

      <Card className="flex min-h-0 flex-col overflow-hidden lg:max-h-full">
        {selectedId === null ? (
          <div className="grid flex-1 place-items-center px-6 py-20 text-center text-muted">
            <div className="grid justify-items-center gap-2.5">
              <Layers3 size={36} className="text-primary" aria-hidden="true" />
              <p className="font-semibold text-fg">{t('profileSystems.choose')}</p>
            </div>
          </div>
        ) : (
          <SystemDetails
            key={selectedId}
            id={selectedId}
            name={findNode(nodes, selectedId)?.name}
            parentPath={parentPath}
            tab={tab}
            onTab={(x) => setParam('tab', x === 'spec' ? null : x)}
            onEdit={() => setDialog('edit')}
            onDelete={() => del.request(selectedId)}
          />
        )}
      </Card>

      {del.dialog}
      {dialog !== null && (
        <SystemFormDialog
          id={dialog === 'edit' && selectedId !== null ? String(selectedId) : undefined}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  )
}

type SystemDetailsProps = {
  id: number
  /** From the tree, so the title shows before the record loads. */
  name?: string
  parentPath: string
  tab: Tab
  onTab: (tab: Tab) => void
  onEdit: () => void
  onDelete: () => void
}

/** The chosen system: its title and actions, then its parts in tabs. */
function SystemDetails({ id, name, parentPath, tab, onTab, onEdit, onDelete }: SystemDetailsProps) {
  const { t } = useTranslation()
  // The same key as the edit dialog's record (useEntityForm): one request serves both.
  const system = useQuery({
    queryKey: [...profileSystemKeys.all, 'detail', String(id)],
    queryFn: ({ signal }) => profileSystemApi.get(String(id), signal),
  })

  // Both tables load at once, so both tabs show their counts; only the chosen one is drawn.
  const specFilters = useTableFilters('spec', SPEC_FILTERS)
  const spec = useServerTable<SpecificationRow>({
    key: 'spec',
    queryKey: specificationKeys.all,
    fetchPage: specificationApi.table,
    filter: { profileSystemId: id, supplierId: specFilters.filters.supplierId },
    defaultSize: 10,
  })
  const accessories = useServerTable<SystemAccessoryRow>({
    key: 'acc',
    queryKey: systemAccessoryKeys.all,
    fetchPage: systemAccessoryApi.table,
    filter: { profileSystemId: id },
    // The old panel's default order for this table.
    defaultSort: { column: 'updated_date', dir: 'desc' },
    defaultSize: 10,
  })
  const count = (table: { isLoading: boolean; error: unknown; pagination: { total: number } }) =>
    table.isLoading || table.error ? null : table.pagination.total

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5 border-b border-line px-4 py-3.5">
        <div className="min-w-0 flex-1">
          {parentPath && <p className="truncate text-xs text-muted">{parentPath}</p>}
          <h2 className="truncate text-xl font-bold">{name ?? system.data?.name}</h2>
        </div>
        <div className="flex gap-1.5">
          <Button variant="outline" icon={<Pencil size={15} />} onClick={onEdit}>
            {t('common.edit')}
          </Button>
          <IconButton
            bordered
            tone="danger"
            label={t('common.delete')}
            className="size-9"
            onClick={onDelete}
          >
            <Trash2 size={16} />
          </IconButton>
        </div>
      </div>

      <Tabs
        id="ps-tabs"
        label={t('profileSystems.sections')}
        value={tab}
        onChange={onTab}
        className="flex-1"
        items={[
          { value: 'spec', label: t('profileSystems.tab_spec'), count: count(spec) },
          {
            value: 'accessories',
            label: t('profileSystems.tab_accessories'),
            count: count(accessories),
          },
          { value: 'filling', label: t('profileSystems.tab_filling') },
        ]}
      >
        {tab === 'filling' ? (
          system.isPending ? (
            <div className="grid place-items-center py-10 text-primary">
              <Spinner />
            </div>
          ) : system.error ? (
            <div className="p-4">
              <Alert>{t('common.load_error')}</Alert>
            </div>
          ) : (
            <FillingDefaults
              glassId={system.data.defaultGlassId}
              fillingGroupId={system.data.fillingGroupId}
            />
          )
        ) : tab === 'accessories' ? (
          <SystemAccessoriesTab systemId={id} table={accessories} />
        ) : (
          <SpecificationTab
            systemId={id}
            table={spec}
            supplierId={specFilters.filters.supplierId}
            onSupplierChange={(supplierId) => specFilters.setFilters({ supplierId })}
          />
        )}
      </Tabs>
    </>
  )
}

/** The old «Заполнение по умолчанию» block — read-only there too. */
function FillingDefaults({
  glassId,
  fillingGroupId,
}: {
  glassId?: number | null
  fillingGroupId?: number | null
}) {
  const { t } = useTranslation()
  const groups = useFillingGroups()
  const articles = useFillingArticles()
  const nameOf = (list: { id: number; name: string }[] | undefined, key?: number | null) =>
    key == null ? '—' : (list?.find((x) => x.id === key)?.name ?? `#${key}`)

  return (
    <div className="grid max-w-3xl gap-3.5 p-4">
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[max-content_1fr]">
        <dt className="text-muted">{t('profileSystems.glass')}</dt>
        <dd>{nameOf(articles.data, glassId)}</dd>
        <dt className="text-muted">{t('profileSystems.default_filling')}</dt>
        <dd>{nameOf(groups.data, fillingGroupId)}</dd>
      </dl>
      <p className="text-sm text-muted">{t('profileSystems.filling_hint')}</p>
    </div>
  )
}
