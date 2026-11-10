import { beforeEach, describe, expect, it, vi } from 'vitest'

const KEY = 'winpro.preferences'

/** A fresh store, rehydrated from what's in localStorage now. */
async function loadStore() {
  vi.resetModules()
  const { usePreferences } = await import('./preferences')
  return usePreferences
}

describe('preferences theme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('starts light, whatever the OS prefers', async () => {
    const store = await loadStore()
    expect(store.getState().theme).toBe('light')
    expect(document.documentElement).not.toHaveClass('dark')
  })

  it('resets a dark theme saved by the old (OS-based) default once', async () => {
    localStorage.setItem(KEY, JSON.stringify({ state: { lang: 'uz', theme: 'dark' }, version: 0 }))
    const store = await loadStore()
    expect(store.getState()).toMatchObject({ lang: 'uz', theme: 'light' })
  })

  it('keeps a dark theme chosen after that', async () => {
    localStorage.setItem(KEY, JSON.stringify({ state: { lang: 'ru', theme: 'dark' }, version: 1 }))
    const store = await loadStore()
    expect(store.getState().theme).toBe('dark')
    expect(document.documentElement).toHaveClass('dark')
  })
})
