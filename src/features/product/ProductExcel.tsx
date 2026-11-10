import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { isClientError } from '@/shared/api/errors'
import type { FilterValues } from '@/shared/hooks/tableFilters'
import { base64ToBlob, saveBlob, XLSX_TYPE } from '@/shared/lib/download'
import { TRANSLATION_EXCEL, translationKeys } from '@/shared/translations'
import { ExcelUploadDialog, Menu } from '@/shared/ui'
import { priceKeys, productApi, productKeys } from './api'
import type { PRODUCT_FILTERS } from './filters'
import { PRICE_EXCEL, type ProductGroup } from './groups'

type ImportKind = 'products' | 'prices' | 'translations'

/**
 * «Импорт» and «Экспорт» of a product group (the old Upload / Export dropdowns).
 * Export takes the list's current filters; an import that skipped rows downloads them as a file.
 */
export function ProductExcel({
  group,
  filters,
}: {
  group: ProductGroup
  filters: FilterValues<typeof PRODUCT_FILTERS>
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [importing, setImporting] = useState<ImportKind | null>(null)
  const [exporting, setExporting] = useState(false)

  const imports = {
    products: group.excel,
    prices: PRICE_EXCEL,
    translations: TRANSLATION_EXCEL,
  }

  const exportExcel = async (kind: 'information' | 'price') => {
    setExporting(true)
    try {
      // The old panel exported by these filters (without the price-warning one).
      const blob = await productApi.exportExcel(kind, {
        searchTxt: filters.searchTxt,
        groupType: group.groupType,
        type: filters.type,
        supplierId: filters.supplierId,
        productSeriesId: filters.productSeriesId,
        profileSystemId: filters.profileSystemId,
      })
      saveBlob(blob, `${group.key}-${kind === 'information' ? 'products' : 'prices'}.xlsx`)
    } catch (e) {
      // 5xx and network errors are toasted by the API client; a 4xx is shown here.
      if (isClientError(e)) toast.error(e.message)
    } finally {
      setExporting(false)
    }
  }

  const upload = async (kind: ImportKind, file: File, onProgress: (p: number) => void) => {
    const result = await productApi.importExcel(imports[kind].upload, file, onProgress)
    if (!result.isEmpty) {
      // Some rows didn't go in; their list comes back as a file (if the backend sent it).
      if (result.base64) saveBlob(base64ToBlob(result.base64, XLSX_TYPE), 'failed-product.xlsx')
      toast.warning(t(result.base64 ? 'excel.failed_rows' : 'excel.failed_rows_no_file'))
    } else {
      toast.success(t('excel.imported'))
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: productKeys.all }),
      queryClient.invalidateQueries({ queryKey: priceKeys.all }),
      queryClient.invalidateQueries({ queryKey: translationKeys.all }),
    ])
  }

  const label = (kind: ImportKind) => t(`product.excel.${kind}`)

  return (
    <>
      <Menu
        label={t('excel.import')}
        icon={<Upload size={16} />}
        items={(['products', 'prices', 'translations'] as const).map((kind) => ({
          key: kind,
          label: label(kind),
          onSelect: () => setImporting(kind),
        }))}
      />
      {/* The old Export menu also had «Translation», but it downloaded prices — left out. */}
      <Menu
        label={t('excel.export')}
        icon={<Download size={16} />}
        disabled={exporting}
        items={[
          { key: 'products', label: label('products'), onSelect: () => exportExcel('information') },
          { key: 'prices', label: label('prices'), onSelect: () => exportExcel('price') },
        ]}
      />
      {importing && (
        <ExcelUploadDialog
          title={t('product.excel.import_title', { what: label(importing) })}
          onClose={() => setImporting(null)}
          onTemplate={() =>
            productApi
              .template(imports[importing].template)
              .then((blob) => saveBlob(blob, `${group.key}-${importing}-template.xlsx`))
          }
          onUpload={(file, onProgress) => upload(importing, file, onProgress)}
        />
      )}
    </>
  )
}
