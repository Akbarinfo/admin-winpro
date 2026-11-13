import { useQuery } from '@tanstack/react-query'
import { furnitureApi, furnitureKeys } from './api'

/** An accessory enum (type, opening type, opening side): its names are i18n keys. */
export function useAccessoryEnum(name: 'type' | 'openingtype' | 'openingside') {
  return useQuery({
    queryKey: [...furnitureKeys.enums, name],
    queryFn: ({ signal }) => furnitureApi.enum(name, signal),
    staleTime: 10 * 60_000,
  })
}
