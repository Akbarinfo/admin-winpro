import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect, useState, type Ref } from 'react'
import { useTranslation } from 'react-i18next'
import { Combobox } from '@/shared/ui'
import { specificationApi, specificationKeys } from './api'
import type { NamedOption } from './types'

type ProductPickerProps = {
  id?: string
  name?: string
  ref?: Ref<HTMLInputElement>
  value: number | null
  onChange: (id: number | null) => void
  onBlur?: () => void
  /** Only products of this type (a joining profile); undefined — any. */
  profileType?: string
  invalid?: boolean
}

/**
 * The specification's product (the old ProductSearchCombobox): the list is searched on the backend,
 * 200 at a time, so a catalogue of thousands stays quick. The chosen one is loaded by id on edit.
 */
export function ProductPicker({ value, onChange, profileType, ...field }: ProductPickerProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [query])

  const list = useQuery({
    queryKey: [...specificationKeys.all, 'products', profileType ?? null, search],
    queryFn: ({ signal }) => specificationApi.searchProducts(search, profileType, signal),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })
  const options = list.data ?? []
  const listed = value === null ? undefined : options.find((o) => o.id === value)

  const chosen = useQuery({
    queryKey: [...specificationKeys.all, 'product', value],
    queryFn: ({ signal }) => specificationApi.product(value!, signal),
    enabled: value !== null && !list.isPending && listed === undefined,
    staleTime: Infinity,
  })
  const selected: NamedOption | null = value === null ? null : (listed ?? chosen.data ?? null)

  return (
    <Combobox
      {...field}
      options={options}
      value={selected}
      onChange={(o) => onChange(o?.id ?? null)}
      getKey={(o) => o.id}
      getLabel={(o) => t(o.name)}
      loading={list.isFetching}
      onQueryChange={setQuery}
    />
  )
}
