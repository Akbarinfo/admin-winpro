import { zodResolver } from '@hookform/resolvers/zod'
import { baseToForm, emptySeal, sealSchema, type SealForm, type SealValues } from '../schema'
import { SealFields } from './SealFields'
import type { ProductFormSpec } from './types'

export const sealForm: ProductFormSpec<SealForm, SealValues> = {
  resolver: zodResolver(sealSchema),
  empty: emptySeal,
  toForm: (p) => ({
    ...emptySeal(),
    ...baseToForm(p),
    articleSpecificWeight: p.articleSpecificWeight ?? null,
    waste: p.waste ?? null,
  }),
  saveUrl: '/v1/product/seal',
  editTitle: 'product.seal.edit',
  /**
   * The old form's body. `checkCreateEdit` is false for a new seal and true for an edit, as it sent.
   * Its «new» body also listed productSeriesId/Name, but they were always undefined (left out of JSON).
   */
  toBody: (v, { id, names }) => ({
    id: id ?? null,
    name: v.name,
    nameInCatalog: v.nameInCatalog,
    article: v.article,
    articleSpecificWeight: v.articleSpecificWeight,
    drawingId: v.drawingId,
    unitId: v.unitId,
    unitName: names.unitName,
    supplierId: v.supplierId,
    supplierName: names.supplierName,
    profileType: v.profileType ?? '',
    waste: v.waste,
    checkCreateEdit: id !== undefined,
  }),
  Fields: SealFields,
}
