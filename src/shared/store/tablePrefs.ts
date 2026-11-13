import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type TablePrefsState = {
  /** «На странице» chosen per table (key: section + table, e.g. «suppliers.suppliers»). */
  sizes: Record<string, number>
  setSize: (table: string, size: number) => void
}

// localStorage, like the language and theme: a convenience that survives closing the browser.
// The rest of a table's state (page, sort, search, filters) stays in the URL.
export const useTablePrefs = create<TablePrefsState>()(
  persist(
    (set) => ({
      sizes: {},
      setSize: (table, size) => set((s) => ({ sizes: { ...s.sizes, [table]: size } })),
    }),
    { name: 'winpro.tables', storage: createJSONStorage(() => localStorage) },
  ),
)

type LastViewState = {
  /** The last query string of each page (pathname → «?a=1&b=2»), to come back to it. */
  search: Record<string, string>
  remember: (pathname: string, search: string) => void
}

// sessionStorage: where the user was in this tab's session, kept over a reload.
export const useLastView = create<LastViewState>()(
  persist(
    (set) => ({
      search: {},
      remember: (pathname, search) =>
        set((s) =>
          s.search[pathname] === search ? s : { search: { ...s.search, [pathname]: search } },
        ),
    }),
    { name: 'winpro.last-view', storage: createJSONStorage(() => sessionStorage) },
  ),
)
