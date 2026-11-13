import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { akfaApi, akfaKeys } from './api'
import { toAkfaItem, toTextureRow, type TextureRow } from './mappingDraft'

/** A WinPro product the dialog is opened for. */
export type ProductRef = {
  productId: number
  productName?: string | null
  article?: string | null
  supplierName?: string | null
  productSeriesName?: string | null
}

const AKFA_PAGE = 50
/** Global mode asks texture-options for each product of a page: smaller pages (as before). */
const PRODUCT_PAGE = 20

// Every opening starts from the server's state (gcTime 0: nothing kept after closing), and while
// open the lists stay as loaded — the draft compares against them; «Обновить» reloads on purpose.
// (Refetching global mode would ask texture-options of every loaded product again.)
const fresh = { gcTime: 0, staleTime: Infinity, refetchOnWindowFocus: false } as const

/** A product's textures, or several products' (a fetch each: there is no endpoint for many). */
export const fetchTextureRows = (products: ProductRef[], signal?: AbortSignal) =>
  Promise.all(
    products.map((p) =>
      akfaApi
        .textureOptions(p.productId, signal)
        .then((options) => options.map((o) => toTextureRow(o, p))),
    ),
  ).then((lists) => lists.flat())

/** The textures of one product (product mode). */
export function useProductTextures(product: ProductRef | undefined) {
  return useQuery({
    queryKey: [...akfaKeys.mappings, 'dialog-product', product?.productId],
    queryFn: ({ signal }) => fetchTextureRows([product!], signal),
    enabled: !!product,
    ...fresh,
  })
}

/** Every product's textures, a page of products at a time (global mode). */
export function useAllTextures(search: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: [...akfaKeys.mappings, 'dialog-textures', search],
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      const page = await akfaApi.winproProducts(
        { search, page: pageParam, size: PRODUCT_PAGE },
        signal,
      )
      const rows: TextureRow[] = await fetchTextureRows(page.data ?? [], signal)
      const total = page.total ?? 0
      const more = (page.data?.length ?? 0) === PRODUCT_PAGE && pageParam * PRODUCT_PAGE < total
      return { rows, next: more ? pageParam + 1 : undefined }
    },
    getNextPageParam: (last) => last.next,
    enabled,
    ...fresh,
  })
}

/** Akfa products with their linked textures; «only unlinked» asks the server for those. */
export function useAkfaProducts(search: string, unmapped: boolean) {
  return useInfiniteQuery({
    queryKey: [...akfaKeys.mappings, 'dialog-akfa', search, unmapped],
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      const page = await akfaApi.mappingAkfaProducts(
        { search, linkStatus: unmapped ? 'unmapped' : 'all', page: pageParam, size: AKFA_PAGE },
        signal,
      )
      const items = (page.data ?? []).map(toAkfaItem)
      const more = items.length === AKFA_PAGE && pageParam * AKFA_PAGE < (page.total ?? 0)
      return { items, next: more ? pageParam + 1 : undefined }
    },
    getNextPageParam: (last) => last.next,
    ...fresh,
  })
}
