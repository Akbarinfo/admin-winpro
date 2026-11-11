import type { ReactNode } from 'react'
import type { Control, FieldPath, FieldValues } from 'react-hook-form'
import { Card, FormField, NumberInput } from '@/shared/ui'

/** A titled card of the product form. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="grid gap-3.5 p-4">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </Card>
  )
}

/** Three fields per row on wide screens. */
export function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-3.5 sm:grid-cols-3">{children}</div>
}

/** A number field of the form; empty is null. */
export function NumberField<T extends FieldValues>({
  control,
  name,
  label,
  required,
  hint,
}: {
  control: Control<T>
  name: FieldPath<T>
  label: string
  required?: boolean
  hint?: string
}) {
  return (
    <FormField control={control} name={name} label={label} required={required} hint={hint}>
      {(field) => (
        <NumberInput
          id={field.id}
          ref={field.ref}
          onBlur={field.onBlur}
          value={field.value as number | null}
          onChange={field.onChange}
          invalid={field.invalid}
        />
      )}
    </FormField>
  )
}
