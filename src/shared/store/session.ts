import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/** User object returned by POST /login. Fields beyond these may exist. */
export type SessionUser = {
  username?: string
  fullName?: string
  email?: string
  phone?: string
  role?: string
}

type SessionState = {
  token: string | null
  user: SessionUser | null
  login: (token: string, user: SessionUser) => void
  logout: () => void
}

// sessionStorage: the session ends when the tab is closed (same as the old panel).
export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'winpro.session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ token, user }) => ({ token, user }),
    },
  ),
)
