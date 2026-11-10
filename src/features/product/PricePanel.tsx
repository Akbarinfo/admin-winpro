import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Copy, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { fileUrl } from '@/shared/api/files'
import { useConfirmDelete } from '@/shared/hooks/useConfirmDelete'
import { useServerTable } from '@/shared/hooks/useServerTable'
import { useTableFilters } from '@/shared/hooks/useTableFilters'
import { formatDate, formatNumber } from '@/shared/lib/format'
import { useCountries } from '@/shared/lookups/countries'
import {
  Button,
  Chip,
  Combobox,
  DataTable,
  IconButton,
  Pagination,
  TextureMark,
  type Column,
} from '@/shared/ui'
import { priceApi, priceKeys, productKeys } from './api'
import { PriceFormDialog } from './PriceFormDialog'
import type { ProductPrice } from './types'

/** URL prefix of the prices table: ?price.page=2&price.countryId=1 */
const KEY = 'price'
const PRICE_FILTERS = { countryId: 'number' } as const

const money = (value: number | null | undefined, symbol: string | null | undefined) =>
  value === null || value === undefined ? '' : `${formatNumber(value)} ${symbol ?? ''}`.trim()

/**
 * Prices of a product, opened right under its row in the list (the old NewPriceLayoutV2):
 * by texture and country, with add / edit / copy / delete.
 */
export function PricePanel({ productId, productName }: { productId: number; productName: string }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const countries = useCountries()
  const { filters, setFilters } = useTableFilters(KEY, PRICE_FILTERS)

  const table = useServerTable<ProductPrice>({
    key: KEY,
    queryKey: priceKeys.all,
    fetchPage: priceApi.table,
    // As the old panel: the country only when one is chosen.
    filter:
      filters.countryId === null ? { productId } : { productId, countryId: filters.countryId },
    defaultSize: 10,
    sorted: false,
  })

  // null — closed; 'new' — adding; a price — editing it.
  const [editing, setEditing] = useState<ProductPrice | 'new' | null>(null)

  const del = useConfirmDelete<ProductPrice>({
    remove: (row) => priceApi.remove(row.id),
    invalidate: priceKeys.all,
    // The product's «price warning» mark may change with its prices.
    onDeleted: () => void queryClient.invalidateQueries({ queryKey: productKeys.all }),
    getName: (row) => `${row.textureName ?? ''}, ${money(row.price, row.currencySymbol)}`,
  })

  const copy = useMutation({
    mutationFn: (row: ProductPrice) => priceApi.copy(row.id),
    onSuccess: async () => {
      toast.success(t('product.price.copied'))
      await queryClient.invalidateQueries({ queryKey: priceKeys.all })
      void queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
  })

  const columns: Column<ProductPrice>[] = [
    {
      key: 'texture',
      title: t('product.price.texture'),
      render: (row) => (
        <span className="inline-flex items-center gap-2">
          <TextureMark src={fileUrl('texture', row.imageId)} color={row.color} />
          <span className="font-medium">{row.textureName}</span>
          {row.akfaExternalName && (
            <Chip
              tone="primary"
              title={t('product.price.akfa_title', { name: row.akfaExternalName })}
            >
              Akfa
            </Chip>
          )}
        </span>
      ),
    },
    {
      key: 'date',
      title: t('product.price.date'),
      render: (row) => <span className="tabular-nums">{formatDate(row.date)}</span>,
    },
    {
      key: 'price',
      title: t('product.price.price'),
      align: 'right',
      render: (row) => (
        <span className="font-medium tabular-nums">{money(row.price, row.currencySymbol)}</span>
      ),
    },
    {
      key: 'priceOfOne',
      title: t('product.price.price_of_one'),
      align: 'right',
      render: (row) => (
        <span className="tabular-nums">{money(row.priceOfOne, row.currencySymbol)}</span>
      ),
    },
    { key: 'countryCode', title: t('product.price.country') },
  ]

  return (
    <section
      aria-label={t('product.price.title_of', { name: productName })}
      className="overflow-hidden rounded-lg border border-line bg-surface"
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-line py-2 pr-2 pl-3.5">
        <span className="min-w-0 flex-1 font-semibold">
          {t('product.price.title')}
          {table.pagination.total > 0 && (
            <span className="font-medium text-faint"> · {table.pagination.total}</span>
          )}
        </span>
        <div className="w-full sm:w-48">
          <Combobox
            aria-label={t('product.price.country')}
            placeholder={t('product.price.all_countries')}
            options={countries.data ?? []}
            value={countries.data?.find((c) => c.id === filters.countryId) ?? null}
            onChange={(c) => setFilters({ countryId: c?.id ?? null })}
            getKey={(c) => c.id}
            getLabel={(c) => c.name}
            loading={countries.isPending}
            clearable
          />
        </div>
        <Button size="sm" icon={<Plus size={14} />} onClick={() => setEditing('new')}>
          {t('product.price.add')}
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={table.rows}
        getRowKey={(row) => row.id}
        loading={table.isLoading}
        fetching={table.isFetching}
        error={table.error}
        onRetry={() => table.refetch()}
        empty={t('product.price.empty')}
        skeletonRows={3}
        actions={(row) => (
          <>
            <IconButton label={t('common.edit')} onClick={() => setEditing(row)}>
              <Pencil size={16} />
            </IconButton>
            <IconButton
              label={t('product.price.copy')}
              onClick={() => copy.mutate(row)}
              disabled={copy.isPending}
            >
              <Copy size={16} />
            </IconButton>
            <IconButton label={t('common.delete')} tone="danger" onClick={() => del.request(row)}>
              <Trash2 size={16} />
            </IconButton>
          </>
        )}
      />
      <Pagination {...table.pagination} />

      {del.dialog}
      {editing !== null && (
        <PriceFormDialog
          productId={productId}
          price={editing === 'new' ? undefined : editing}
          countryId={filters.countryId}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  )
}
