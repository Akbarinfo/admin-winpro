import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { FileSpreadsheet, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useTableFilters } from '@/shared/hooks/useTableFilters'
import { useTableParams } from '@/shared/hooks/useTableParams'
import { formatDate } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'
import {
  Button,
  Chip,
  DataTable,
  Highlight,
  Pagination,
  SearchInput,
  Select,
  TableCard,
  TableToolbar,
  Tabs,
  type Column,
} from '@/shared/ui'
import { AKFA_PAGE_SIZE, akfaApi, akfaKeys } from './api'
import { CreateFromAkfaDialog, type CreatedProduct } from './CreateFromAkfaDialog'
import { formatPrice } from './helpers'
import { MappingDialog } from './MappingDialog'
import { MappingImportDialog } from './MappingImportDialog'
import type { AkfaProduct, WinproProduct } from './types'
import type { ProductRef } from './useMappingLists'

const LINKS = ['all', 'mapped', 'unmapped'] as const
const FILTERS = { link: 'string' } as const
/** «Akfa products» filter → GET /v1/akfa/products params (as before). */
const AKFA_LINK_QUERY: Record<string, { mappingStatus?: string }> = {
  all: {},
  mapped: { mappingStatus: 'MAPPED' },
  unmapped: { mappingStatus: 'NEW' },
}

type AkfaRow = AkfaProduct & {
  article?: string | null
  rateUpdatedAt?: string | null
  lastSeenAt?: string | null
  mappingStatus?: string | null
  linkedTextures?: unknown[] | null
  mappedTextureCount?: number | null
  targets?: unknown[] | null
}

/** How many textures an Akfa product is linked to (the old akfaLinkCount). */
const linkCount = (r: AkfaRow) =>
  r.linkedTextures?.length ??
  r.mappedTextureCount ??
  r.targets?.length ??
  (r.mappingStatus === 'MAPPED' ? 1 : 0)

/** A dot and a label: green — linked, yellow — partly, grey — not. */
function LinkBadge({ tone, children }: { tone: 'ok' | 'warn' | 'default'; children: string }) {
  return (
    <Chip tone={tone} className="gap-1.5">
      <span
        aria-hidden="true"
        className={cn(
          'size-1.5 rounded-full',
          tone === 'ok' ? 'bg-ok' : tone === 'warn' ? 'bg-warn' : 'bg-faint',
        )}
      />
      {children}
    </Chip>
  )
}

/**
 * «Сопоставление» (the old AkfaMappingTab): WinPro products and Akfa products, each with its link
 * state. Links are made in the mapping dialog: a WinPro product's own, or «+ Маппинг» for all;
 * an unlinked Akfa product can become a new WinPro product.
 */
export function MappingTab() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const view = searchParams.get('view') === 'akfa' ? 'akfa' : 'winpro'

  const winpro = useLinkTable('mw')
  const akfa = useLinkTable('ma')

  const winproList = useQuery({
    queryKey: [...akfaKeys.mappings, 'winpro', winpro.query],
    queryFn: ({ signal }) =>
      akfaApi.winproProducts(
        { linkStatus: winpro.link, search: winpro.search, page: winpro.page, size: winpro.size },
        signal,
      ),
    placeholderData: keepPreviousData,
  })
  const akfaList = useQuery({
    queryKey: [...akfaKeys.products, 'mapping', akfa.query],
    queryFn: ({ signal }) =>
      akfaApi.products(
        { ...AKFA_LINK_QUERY[akfa.link], search: akfa.search, page: akfa.page, size: akfa.size },
        signal,
      ) as Promise<{ data: AkfaRow[]; total: number }>,
    placeholderData: keepPreviousData,
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: akfaKeys.all })
  // null — closed; 'all' — every product's textures; a product — its own
  const [mapping, setMapping] = useState<ProductRef | 'all' | null>(null)
  const [creating, setCreating] = useState<AkfaRow | null>(null)
  const [importing, setImporting] = useState(false)

  const onCreated = (p: CreatedProduct) => {
    setCreating(null)
    void refresh()
    toast.success(t('akfa.createFromAkfa.created', { name: p.productName }), {
      duration: 6000,
      ...(p.productId != null && {
        action: {
          label: t('akfa.createFromAkfa.open_product'),
          onClick: () =>
            setMapping({ productId: p.productId!, productName: p.productName, article: p.article }),
        },
      }),
    })
  }

  const openProduct = (r: WinproProduct) =>
    setMapping({
      productId: r.productId,
      productName: r.productName,
      article: r.article,
      supplierName: r.supplierName,
      productSeriesName: r.productSeriesName,
    })

  const winproColumns: Column<WinproProduct>[] = [
    {
      key: 'productName',
      title: t('akfa.mapping.col_winpro_product'),
      render: (r) => (
        <div className="grid gap-0.5">
          {/* the row opens on a click too; the name is the keyboard's way in */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              openProduct(r)
            }}
            className="justify-self-start text-left font-semibold hover:text-primary-strong hover:underline"
          >
            <Highlight text={r.productName ?? ''} query={winpro.search} />
          </button>
          <span className="text-xs text-faint">
            {r.article || '—'}
            {r.unitName ? ` · ${r.unitName}` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'articleGroupType',
      title: t('akfa.mapping.col_group'),
      render: (r) => <Chip>{r.articleGroupType ? t(r.articleGroupType) : '—'}</Chip>,
    },
    {
      key: 'supplierName',
      title: t('akfa.mapping.col_supplier'),
      render: (r) => r.supplierName || '—',
    },
    {
      key: 'productSeriesName',
      title: t('akfa.mapping.col_series'),
      render: (r) => r.productSeriesName || '—',
    },
    {
      key: 'price',
      title: t('akfa.mapping.col_price'),
      align: 'right',
      className: 'tabular-nums',
      render: (r) => formatPrice(r.price, r.currencySymbol),
    },
    {
      key: 'status',
      title: t('akfa.common.status_label'),
      render: (r) => {
        const total = r.totalTextureCount ?? 0
        const mapped = r.mappedTextureCount ?? 0
        return (
          <div className="grid justify-items-start gap-1">
            {total > 0 ? (
              <LinkBadge tone={mapped === total ? 'ok' : mapped > 0 ? 'warn' : 'default'}>
                {t('akfa.mapping.winpro_mapped_ratio', { mapped, total })}
              </LinkBadge>
            ) : (
              <span className="text-faint">—</span>
            )}
            {!r.hasPrice && (
              <span className="text-xs text-faint">{t('akfa.mapping.no_price_yet')}</span>
            )}
          </div>
        )
      },
    },
  ]

  const akfaColumns: Column<AkfaRow>[] = [
    {
      key: 'name',
      title: t('akfa.mapping.col_akfa_product'),
      render: (r) => (
        <div className="grid gap-0.5">
          <span className="font-semibold">
            <Highlight text={r.name} query={akfa.search} />
          </span>
          <span className="text-xs text-faint">
            {r.externalId ?? '—'}
            {r.article ? ` · ${r.article}` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'groupName',
      title: t('akfa.mapping.col_group'),
      render: (r) => <Chip>{r.groupName || '—'}</Chip>,
    },
    {
      key: 'currentRate',
      title: t('akfa.mapping.col_akfa_price'),
      align: 'right',
      className: 'tabular-nums',
      render: (r) => formatPrice(r.currentRate, r.currentRateCurrency),
    },
    {
      key: 'status',
      title: t('akfa.common.status_label'),
      render: (r) => {
        const count = linkCount(r)
        return count > 0 ? (
          <LinkBadge tone="ok">
            {count > 1
              ? t('akfa.mapping.winpro_mapped', { count })
              : t('akfa.mapping.filter_mapped')}
          </LinkBadge>
        ) : (
          <div className="grid justify-items-start gap-1.5">
            <LinkBadge tone="default">{t('akfa.mapping.winpro_unmapped')}</LinkBadge>
            <Button size="sm" variant="outline" className="h-7" onClick={() => setCreating(r)}>
              {t('akfa.mapping.create_winpro')}
            </Button>
          </div>
        )
      },
    },
    {
      key: 'updated',
      title: t('akfa.mapping.col_updated'),
      className: 'text-xs text-faint',
      render: (r) => formatDate(r.rateUpdatedAt || r.lastSeenAt) || '—',
    },
  ]

  const toolbar = (table: ReturnType<typeof useLinkTable>) => (
    <TableToolbar>
      <Select
        aria-label={t('akfa.mapping_filter')}
        className="w-auto"
        value={table.link}
        onChange={(e) => table.setLink(e.target.value)}
      >
        {LINKS.map((key) => (
          <option key={key} value={key}>
            {t(`akfa.mapping.filter_${key}`)}
          </option>
        ))}
      </Select>
      <SearchInput
        value={table.search}
        onChange={table.setSearch}
        placeholder={t('akfa.common.search_placeholder')}
        minLength={1}
      />
    </TableToolbar>
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Tabs
        id="akfa-mapping"
        label={t('akfa.tabs.mapping')}
        value={view}
        onChange={(next) =>
          setSearchParams(
            (prev) => {
              const params = new URLSearchParams(prev)
              if (next === 'akfa') params.set('view', 'akfa')
              else params.delete('view')
              return params
            },
            { replace: true },
          )
        }
        items={[
          {
            value: 'winpro',
            label: t('akfa.mapping.subtab_winpro'),
            count: winproList.data?.total ?? null,
          },
          {
            value: 'akfa',
            label: t('akfa.mapping.subtab_akfa'),
            count: akfaList.data?.total ?? null,
          },
        ]}
        className="min-h-0 flex-1"
        panelClassName="flex flex-col pt-3"
        aside={
          <>
            <Button
              variant="outline"
              icon={<FileSpreadsheet size={16} />}
              onClick={() => setImporting(true)}
            >
              {t('akfa.mapping.import_excel')}
            </Button>
            <Button icon={<Plus size={16} />} onClick={() => setMapping('all')}>
              {t('akfa.add_mapping_button')}
            </Button>
          </>
        }
      >
        {view === 'winpro' ? (
          <TableCard>
            {toolbar(winpro)}
            <DataTable
              columns={winproColumns}
              rows={winproList.data?.data ?? []}
              getRowKey={(r) => r.productId}
              loading={winproList.isPending}
              fetching={winproList.isFetching}
              error={winproList.error}
              onRetry={() => winproList.refetch()}
              onRowClick={openProduct}
              empty={t('akfa.mapping.empty_winpro')}
            />
            <Pagination {...winpro.pagination(winproList.data?.total)} />
          </TableCard>
        ) : (
          <TableCard>
            {toolbar(akfa)}
            <DataTable
              columns={akfaColumns}
              rows={akfaList.data?.data ?? []}
              getRowKey={(r) => r.id}
              loading={akfaList.isPending}
              fetching={akfaList.isFetching}
              error={akfaList.error}
              onRetry={() => akfaList.refetch()}
              empty={t('akfa.mapping.empty_akfa')}
            />
            <Pagination {...akfa.pagination(akfaList.data?.total)} />
          </TableCard>
        )}
      </Tabs>

      {mapping && (
        <MappingDialog
          key={mapping === 'all' ? 'all' : mapping.productId}
          product={mapping === 'all' ? undefined : mapping}
          onClose={() => setMapping(null)}
          onSaved={refresh}
        />
      )}
      {creating && (
        <CreateFromAkfaDialog
          akfaProduct={creating}
          onClose={() => setCreating(null)}
          onCreated={onCreated}
        />
      )}
      {importing && (
        <MappingImportDialog onClose={() => setImporting(false)} onImported={refresh} />
      )}
    </div>
  )
}

/** One sub-table's page, search and link filter, in the URL under its key. */
function useLinkTable(key: string) {
  const [params, setParams] = useTableParams(key, AKFA_PAGE_SIZE)
  const { filters, setFilters } = useTableFilters(key, FILTERS)
  const link = LINKS.find((l) => l === filters.link) ?? 'all'
  const search = params.search ?? ''
  return {
    link,
    search,
    page: params.page,
    size: params.size,
    query: [link, search, params.page, params.size] as const,
    setLink: (value: string) => setFilters({ link: value === 'all' ? null : value }),
    setSearch: (q: string) => setParams({ search: q, page: 1 }),
    pagination: (total?: number) => ({
      page: params.page,
      size: params.size,
      total: total ?? 0,
      onChange: (next: { page: number; size: number }) => setParams(next),
    }),
  }
}
