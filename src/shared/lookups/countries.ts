import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { api } from '@/shared/api/client'

/** A country from /v1/country/list (edited in «Страны»). Also drives phone masks. */
export type Country = {
  id: number
  name: string
  code: string
  /** «+998» */
  phoneCode: string
  /** «+998 (##) ### ## ##» — `#` is a digit */
  phoneFormat: string
  digitsLength?: number
  flagUrl?: string | null
  isActive?: boolean
  isDefault?: boolean
}

const FLAGS = 'https://storage.winpro.uz/winpro/assets/icons/flag/72x54'

/** Used until the list loads (and if it is empty) — the same defaults as the my-winpro app. */
export const DEFAULT_COUNTRIES: Country[] = [
  {
    id: 2,
    name: 'Uzbekistan',
    code: 'uz',
    phoneCode: '+998',
    phoneFormat: '+998 (##) ### ## ##',
    digitsLength: 9,
    flagUrl: `${FLAGS}/uz.png`,
    isActive: true,
    isDefault: true,
  },
  {
    id: 1,
    name: 'Kazakhstan',
    code: 'kz',
    phoneCode: '+7',
    phoneFormat: '+7 (###) ### ## ##',
    digitsLength: 10,
    flagUrl: `${FLAGS}/kz.png`,
    isActive: true,
  },
]

export const countryKeys = { all: ['country'] as const }

export function useCountries() {
  return useQuery({
    queryKey: [...countryKeys.all, 'list'],
    queryFn: ({ signal }) => api.get<Country[]>('/v1/country/list', { signal }).then((r) => r.data),
    staleTime: 10 * 60_000,
  })
}

/** Active countries for a phone field, default first; the built-in pair while loading. */
export function usePhoneCountries() {
  const { data } = useCountries()
  return useMemo(() => {
    const active = (data ?? []).filter((c) => c.isActive !== false && c.phoneCode && c.phoneFormat)
    const list = active.length ? active : DEFAULT_COUNTRIES
    return [...list].sort((a, b) => Number(!!b.isDefault) - Number(!!a.isDefault))
  }, [data])
}
