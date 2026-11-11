import type { ReactNode } from 'react'
import type { FieldValues, Resolver, UseFormReturn } from 'react-hook-form'
import type { BaseProductForm, BaseProductValues } from '../schema'
import type { ChosenNames, ProductDetail } from '../types'

/**
 * What a product group adds to the common form (ProductFormPage): its own fields, their rules,
 * and the exact body the old panel sent. Everything else — name, article, type, unit, supplier,
 * drawing, translations, saving — the shell does.
 */
export type ProductFormSpec<
  TForm extends BaseProductForm & FieldValues,
  TValues extends BaseProductValues,
> = {
  resolver: Resolver<TForm, unknown, TValues>
  empty: () => TForm
  toForm: (product: ProductDetail) => TForm
  /** POST (new) and PUT (edit) both go here, multipart «data» + «image». */
  saveUrl: string
  /** The «data» part: field by field as the old form built it. `id` is the URL string. */
  toBody: (values: TValues, ctx: { id?: string; names: ChosenNames }) => object
  /** i18n key of the edit page's title */
  editTitle: string
  /** The «Серия» picker next to the unit (profiles only). */
  withSeries?: boolean
  /** The group's own sections, between the main fields and the drawing. */
  Fields: (props: { form: UseFormReturn<TForm, unknown, TValues> }) => ReactNode
}

// The shell treats every spec alike; each group's file keeps its own exact types.
// oxlint-disable-next-line typescript/no-explicit-any
export type AnyProductFormSpec = ProductFormSpec<any, any>
