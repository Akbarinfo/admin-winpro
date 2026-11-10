import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type Lang = 'ru' | 'uz' | 'en'
export type Theme = 'light' | 'dark'

export const LANGS: Lang[] = ['ru', 'uz', 'en']

type PreferencesState = {
  lang: Lang
  theme: Theme
  setLang: (lang: Lang) => void
  toggleTheme: () => void
}

// localStorage: language and theme are conveniences, not secrets — they survive closing the browser.
// The panel starts light (whatever the OS prefers); dark is chosen with the toggle and remembered.
export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      lang: 'ru',
      theme: 'light',
      setLang: (lang) => set({ lang }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
    }),
    {
      name: 'winpro.preferences',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ lang, theme }) => ({ lang, theme }),
      // v0 started from the OS theme, so a saved «dark» may never have been chosen: start light once.
      version: 1,
      migrate: (saved, version) => {
        const state = saved as Pick<PreferencesState, 'lang' | 'theme'>
        return version < 1 ? { ...state, theme: 'light' as Theme } : state
      },
    },
  ),
)

const applyTheme = (theme: Theme) =>
  document.documentElement.classList.toggle('dark', theme === 'dark')

applyTheme(usePreferences.getState().theme)
usePreferences.subscribe((state, prev) => {
  if (state.theme !== prev.theme) applyTheme(state.theme)
})
