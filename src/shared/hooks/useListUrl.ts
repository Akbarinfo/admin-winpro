import { useLastView } from '@/shared/store/tablePrefs'

/**
 * A list page's address as the user last left it (its search, page, sort, filters), so a «back»
 * link or a form closing returns there, as the old panel's navigate(-1) did.
 */
export function useListUrl(pathname: string) {
  const search = useLastView((s) => s.search[pathname])
  return `${pathname}${search ?? ''}`
}
