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

const systemTheme = (): Theme =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

// localStorage: language and theme are conveniences, not secrets — they survive closing the browser.
export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      lang: 'ru',
      theme: systemTheme(),
      setLang: (lang) => set({ lang }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
    }),
    {
      name: 'winpro.preferences',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ lang, theme }) => ({ lang, theme }),
    },
  ),
)

const applyTheme = (theme: Theme) =>
  document.documentElement.classList.toggle('dark', theme === 'dark')

applyTheme(usePreferences.getState().theme)
usePreferences.subscribe((state, prev) => {
  if (state.theme !== prev.theme) applyTheme(state.theme)
})
