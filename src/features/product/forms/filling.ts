import { zodResolver } from '@hookform/resolvers/zod'
import {
  baseToForm,
  emptyFilling,
  fillingSchema,
  type FillingForm,
  type FillingValues,
} from '../schema'
import { FillingFields } from './FillingFields'
import type { ProductFormSpec } from './types'

export const fillingForm: ProductFormSpec<FillingForm, FillingValues> = {
  resolver: zodResolver(fillingSchema),
  empty: emptyFilling,
  toForm: (p) => ({
    ...emptyFilling(),
    ...baseToForm(p),
    length: p.length ?? null,
    width: p.width ?? null,
    thickness: p.thickness ?? null,
    articleSpecificWeight: p.articleSpecificWeight ?? null,
    waste: p.waste ?? null,
    needCuttingOptimization: !!p.needCuttingOptimization,
  }),
  saveUrl: '/v1/product/filling',
  editTitle: 'product.filling.edit',
  /**
   * The old form's body (the same for a new and an edited filling). Its «new» body also listed
   * productSeriesId/Name, but they were always undefined (left out of JSON).
   * Numbers go as numbers and empty ones as null — the old form sent strings and "" (as for profiles).
   */
  toBody: (v, { id, names }) => ({
    id: id ?? null,
    name: v.name,
    nameInCatalog: v.nameInCatalog,
    article: v.article,
    length: v.length,
    width: v.width,
    thickness: v.thickness,
    articleSpecificWeight: v.articleSpecificWeight,
    drawingId: v.drawingId,
    unitId: v.unitId,
    unitName: names.unitName,
    supplierId: v.supplierId,
    supplierName: names.supplierName,
    profileType: v.profileType ?? '',
    waste: v.waste,
    needCuttingOptimization: v.needCuttingOptimization,
  }),
  Fields: FillingFields,
}
