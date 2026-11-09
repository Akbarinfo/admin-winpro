import type { ReactElement, ReactNode } from 'react'
import {
  useController,
  type Control,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'
import { Field } from './Field'

export type FormFieldRenderProps<
  T extends FieldValues,
  N extends FieldPath<T>,
> = ControllerRenderProps<T, N> & {
  id: string
  invalid: boolean
}

type FormFieldProps<T extends FieldValues, N extends FieldPath<T>> = {
  control: Control<T>
  name: N
  label: string
  required?: boolean
  hint?: string
  labelAside?: ReactNode
  /** Renders the control; receives value, onChange, onBlur, ref, id and invalid. */
  children: (field: FormFieldRenderProps<T, N>) => ReactElement
}

/**
 * A react-hook-form field with label, required mark and error text in one place.
 * For plain text inputs `form.register()` inside <Field> is enough; use this for
 * controlled inputs (Combobox, NumberInput) that need value/onChange.
 *
 *   <FormField control={form.control} name="rate" label={t('exchange.rate')} required>
 *     {(field) => <NumberInput {...field} />}
 *   </FormField>
 */
export function FormField<T extends FieldValues, N extends FieldPath<T>>({
  control,
  name,
  label,
  required,
  hint,
  labelAside,
  children,
}: FormFieldProps<T, N>) {
  const { field, fieldState } = useController({ control, name })
  return (
    <Field
      label={label}
      htmlFor={name}
      error={fieldState.error?.message}
      hint={hint}
      required={required}
      labelAside={labelAside}
    >
      {children({ ...field, id: name, invalid: !!fieldState.error })}
    </Field>
  )
}
