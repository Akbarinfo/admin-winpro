import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { Download, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { isClientError } from '@/shared/api/errors'
import { useConfirmDelete } from '@/shared/hooks/useConfirmDelete'
import { useTableParams } from '@/shared/hooks/useTableParams'
import { saveBlob } from '@/shared/lib/download'
import { useActiveLanguages } from '@/shared/lookups/languages'
import {
  Button,
  DataTable,
  ExcelUploadDialog,
  Highlight,
  IconButton,
  ListLayout,
  PageHeader,
  Pagination,
  SearchInput,
  TableCard,
  TableToolbar,
  type Column,
} from '@/shared/ui'
import { translationApi, translationKeyKeys } from './api'
import type { TranslationRow } from './types'

const KEY = 'translations'
/** The old page's order: by key, descending. */
const DEFAULT_SORT = { column: 'key', dir: 'desc' } as const

/** /translations: every key with its text in each active language (the old layout/translation). */
export function TranslationListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { search: urlSearch } = useLocation()
  const languages = useActiveLanguages()

  const [params, setParams] = useTableParams(KEY, 10, DEFAULT_SORT)
  const sort = params.sort ?? DEFAULT_SORT
  const search = params.search ?? ''
  const list = useQuery({
    queryKey: [...translationKeyKeys.all, 'table', params.page, params.size, sort, search],
    queryFn: ({ signal }) =>
      translationApi.table({ page: params.page, size: params.size, sort, search }, signal),
    placeholderData: keepPreviousData,
  })

  const del = useConfirmDelete<TranslationRow>({
    remove: (row) => translationApi.remove(row.key),
    invalidate: translationKeyKeys.all,
    getName: (row) => row.key,
  })

  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const upload = async (file: File, onProgress: (p: number) => void) => {
    const result = await translationApi.importExcel(file, onProgress)
    // as the old page: each refused row's reason, then a success line if any went in
    if ((result.failed ?? 0) > 0) for (const error of result.errors ?? []) toast.error(error)
    if ((result.success ?? 0) > 0) toast.success(t('excel.imported'))
    await queryClient.invalidateQueries({ queryKey: translationKeyKeys.all })
  }
  const exportExcel = async () => {
    setExporting(true)
    try {
      saveBlob(await translationApi.exportExcel(), 'translations.xlsx')
    } catch (e) {
      // 5xx and network errors are toasted by the API client; a 4xx is shown here.
      if (isClientError(e)) toast.error(e.message)
    } finally {
      setExporting(false)
    }
  }

  const columns: Column<TranslationRow>[] = [
    {
      key: 'key',
      title: t('translationKeys.key'),
      sortable: true,
      className: 'font-medium',
      render: (row) => <Highlight text={row.key} query={search} />,
    },
    // a column per active language, not sortable (as before)
    ...(languages.data ?? []).map((lang): Column<TranslationRow> => ({
      key: `lang_${lang.code}`,
      title: lang.name,
      render: (row) => {
        const value = row.translations?.find((x) => x.code === lang.code)?.value
        return value ? (
          <Highlight text={value} query={search} />
        ) : (
          <span className="text-faint">—</span>
        )
      },
    })),
  ]

  const open = (to: string) => navigate({ pathname: to, search: urlSearch })

  return (
    <ListLayout>
      <PageHeader
        title={t('translationKeys.title')}
        actions={
          <>
            <Button
              variant="outline"
              icon={<Upload size={16} />}
              onClick={() => setImporting(true)}
            >
              {t('translationKeys.import')}
            </Button>
            <Button
              variant="outline"
              icon={<Download size={16} />}
              loading={exporting}
              onClick={exportExcel}
            >
              {t('translationKeys.export')}
            </Button>
            <Button icon={<Plus size={16} />} onClick={() => open('add')}>
              {t('translationKeys.add')}
            </Button>
          </>
        }
      />

      <TableCard>
        <TableToolbar>
          {/* the old search sent any text (after a pause) */}
          <SearchInput
            value={search}
            onChange={(q) => setParams({ search: q, page: 1 })}
            minLength={1}
            delay={500}
          />
        </TableToolbar>
        <DataTable
          columns={columns}
          rows={list.data?.data ?? []}
          getRowKey={(row) => row.key}
          loading={list.isPending}
          fetching={list.isFetching}
          sort={sort}
          onSortChange={(next) => setParams({ sort: next, page: 1 })}
          highlight={search}
          error={list.error}
          onRetry={() => list.refetch()}
          empty={search ? t('common.nothing_found') : t('translationKeys.empty')}
          actions={(row) => (
            <>
              <IconButton
                label={t('common.edit')}
                onClick={() => open(`update/${encodeURIComponent(row.key)}`)}
              >
                <Pencil size={16} />
              </IconButton>
              <IconButton label={t('common.delete')} tone="danger" onClick={() => del.request(row)}>
                <Trash2 size={16} />
              </IconButton>
            </>
          )}
        />
        <Pagination
          page={params.page}
          size={params.size}
          total={list.data?.total ?? 0}
          onChange={(next) => setParams(next)}
        />
      </TableCard>

      {del.dialog}
      {importing && (
        <ExcelUploadDialog
          title={t('translationKeys.import_title')}
          onClose={() => setImporting(false)}
          onUpload={upload}
        />
      )}
      {/* add / update/:key render the form dialog over the list */}
      <Outlet />
    </ListLayout>
  )
}
