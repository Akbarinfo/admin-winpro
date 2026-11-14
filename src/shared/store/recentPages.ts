import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/** A section the user opened: its menu path, the exact address last seen in it, and when. */
export type RecentPage = { section: string; url: string; at: number }

export const RECENT_LIMIT = 10

type RecentPagesState = {
  /** Per user (several people may share a browser), newest first, one entry per section. */
  byUser: Record<string, RecentPage[]>
  visit: (user: string, section: string, url: string, at?: number) => void
  /** Forgets this user's list (the others' stay). */
  clear: (user: string) => void
}

// localStorage: unlike the session, the home page's «recently opened» should survive closing the browser.
export const useRecentPages = create<RecentPagesState>()(
  persist(
    (set) => ({
      byUser: {},
      visit: (user, section, url, at = Date.now()) =>
        set((s) => {
          const list = s.byUser[user] ?? []
          if (list[0]?.section === section && list[0].url === url) return s
          const next = [{ section, url, at }, ...list.filter((p) => p.section !== section)]
          return { byUser: { ...s.byUser, [user]: next.slice(0, RECENT_LIMIT) } }
        }),
      clear: (user) =>
        set((s) => {
          const rest = { ...s.byUser }
          delete rest[user]
          return { byUser: rest }
        }),
    }),
    { name: 'winpro.recent-pages', storage: createJSONStorage(() => localStorage) },
  ),
)
