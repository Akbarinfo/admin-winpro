import { zodResolver } from '@hookform/resolvers/zod'
import {
  accessoriesSchema,
  baseToForm,
  emptyAccessories,
  FITTINGS_TYPE,
  HANDLE_SUBTYPE,
  type AccessoriesForm,
  type AccessoriesValues,
} from '../schema'
import { AccessoriesFields } from './AccessoriesFields'
import type { ProductFormSpec } from './types'

export const accessoriesForm: ProductFormSpec<AccessoriesForm, AccessoriesValues> = {
  resolver: zodResolver(accessoriesSchema),
  empty: emptyAccessories,
  toForm: (p) => ({
    ...emptyAccessories(),
    ...baseToForm(p),
    articleSpecificWeight: p.articleSpecificWeight ?? null,
    // As loaded: the old form kept the record's values, null included.
    subtype: p.subtype ?? null,
    handleType: p.handleType ?? null,
  }),
  saveUrl: '/v1/product/accessories',
  editTitle: 'product.accessories.edit',
  /**
   * The old form's body (the same for a new and an edited accessory). The subtype goes only for
   * fittings, the handle only for the HANDLE subtype — checked on the form's subtype, as there.
   * Numbers go as numbers and empty ones as null — the old form sent strings and "" (as for profiles).
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
    subtype: v.profileType === FITTINGS_TYPE ? v.subtype : null,
    handleType: v.subtype === HANDLE_SUBTYPE ? v.handleType : null,
  }),
  Fields: AccessoriesFields,
}
