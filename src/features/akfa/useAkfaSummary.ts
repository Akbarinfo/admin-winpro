import { useQuery } from '@tanstack/react-query'
import { akfaApi, akfaKeys, type AkfaProductQuery } from './api'

/** The old page asked for the summary every minute. */
const POLL_MS = 60_000

/** How many products a filter matches: one row asked, its `total` read. */
function useCount(params: AkfaProductQuery) {
  return useQuery({
    queryKey: [...akfaKeys.summary, 'count', params],
    queryFn: ({ signal }) => akfaApi.products({ ...params, size: 1 }, signal).then((p) => p.total),
    refetchInterval: POLL_MS,
  })
}

/**
 * The summary: the listener's state for the header, and the counts. Mapped, ignored and new-product
 * counts aren't in /summary (its newCount is always 0): they come from the product list's totals.
 */
export function useAkfaSummary() {
  const summary = useQuery({
    queryKey: akfaKeys.summary,
    queryFn: ({ signal }) => akfaApi.summary(signal),
    refetchInterval: POLL_MS,
  })
  const mapped = useCount({ mappingStatus: 'MAPPED' })
  const ignored = useCount({ mappingStatus: 'IGNORED' })
  const newProducts = useCount({ source: 'PRODUCT' })
  return {
    summary: summary.data,
    counts: summary.data && {
      ...summary.data,
      mappedCount: mapped.data,
      ignoredCount: ignored.data,
      newProductsCount: newProducts.data,
    },
  }
}
