import {
  useWatch,
  type Control,
  type FieldPath,
  type FieldValues,
  type UseFormReturn,
} from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { fileUrl } from '@/shared/api/files'
import { Combobox, FormField, TextureMark } from '@/shared/ui'
import { ProductPicker } from './ProductPicker'
import { useProductTextures, type TextureOption } from './textures'

/** A form with a product and one of its textures (specification rows of the catalogue). */
type ProductTextureShape = FieldValues & { productId: number | null; textureId: number | null }

type ProductTextureFieldsProps<T extends ProductTextureShape> = {
  form: UseFormReturn<T, unknown, unknown>
  productLabel: string
  textureLabel: string
  /** Called with the product as it is chosen (e.g. to keep its name). */
  onProductChosen?: (product: { id: number; name: string } | null) => void
}

/**
 * Product (searched on the backend) and its texture: the old specification modals'
 * ProductSearchCombobox + texture Combobox. Choosing another product drops the texture,
 * which belongs to the product (the old modals kept it).
 */
export function ProductTextureFields<T extends ProductTextureShape>({
  form,
  productLabel,
  textureLabel,
  onProductChosen,
}: ProductTextureFieldsProps<T>) {
  const { t } = useTranslation()
  // The form's output type doesn't matter to these two fields.
  const control = form.control as unknown as Control<T>
  const productName = 'productId' as FieldPath<T>
  const textureName = 'textureId' as FieldPath<T>
  const productId = (useWatch({ control, name: productName }) ?? null) as number | null
  const textures = useProductTextures(productId)

  return (
    <>
      <FormField control={control} name={productName} label={productLabel} required>
        {(field) => (
          <ProductPicker
            id={field.id}
            ref={field.ref}
            onBlur={field.onBlur}
            value={field.value as number | null}
            onChange={(id, product) => {
              field.onChange(id)
              form.setValue(textureName, null as T[typeof textureName])
              onProductChosen?.(product)
            }}
            invalid={field.invalid}
          />
        )}
      </FormField>

      <FormField control={control} name={textureName} label={textureLabel}>
        {(field) => (
          <Combobox<TextureOption>
            id={field.id}
            ref={field.ref}
            onBlur={field.onBlur}
            value={textures.data?.find((x) => x.id === field.value) ?? null}
            onChange={(x) => field.onChange(x?.id ?? null)}
            options={textures.data ?? []}
            getKey={(x) => x.id}
            getLabel={(x) => t(x.name)}
            renderOption={(x) => (
              <span className="flex items-center gap-2">
                <TextureMark src={fileUrl('texture', x.imageId)} color={x.color} />
                {t(x.name)}
              </span>
            )}
            loading={productId !== null && textures.isPending}
            disabled={productId === null}
            clearable
          />
        )}
      </FormField>
    </>
  )
}
