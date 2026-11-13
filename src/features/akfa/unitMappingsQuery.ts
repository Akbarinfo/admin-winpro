import { akfaApi, akfaKeys } from './api'

/** The unit mappings list: the page shows it, the edit dialog takes its record from it. */
export const unitMappingsQuery = {
  queryKey: [...akfaKeys.units, 'list'],
  queryFn: ({ signal }: { signal: AbortSignal }) => akfaApi.unitMappings(signal),
}
