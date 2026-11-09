import { describe, expect, it } from 'vitest'
import { i18n } from './index'
import en from './locales/en.json'
import legacyEn from './locales/legacy/en.json'
import legacyRu from './locales/legacy/ru.json'
import legacyUz from './locales/legacy/uz.json'
import ru from './locales/ru.json'
import uz from './locales/uz.json'

type Json = Record<string, unknown>

/** All leaf paths: { a: { b: 'x' } } → ['a.b'] */
const leafKeys = (obj: Json, prefix = ''): string[] =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? leafKeys(v as Json, `${prefix}${k}.`) : [`${prefix}${k}`],
  )

// Feature texts: src/features/<name>/locales/{ru,uz,en}.json
const featureFiles = import.meta.glob<Json>('/src/features/*/locales/*.json', {
  eager: true,
  import: 'default',
})
const features = new Map<string, Record<string, Json>>()
for (const [path, json] of Object.entries(featureFiles)) {
  const [, name, lang] = /features\/([^/]+)\/locales\/(\w+)\.json$/.exec(path)!
  features.set(name, { ...features.get(name), [lang]: json })
}

const legacy = { ru: legacyRu, uz: legacyUz, en: legacyEn } as Record<string, Json>

// Run every feature's i18n.ts, as the app does on start.
import.meta.glob('/src/features/*/i18n.ts', { eager: true })

describe('translations', () => {
  // Catches a namespace being swallowed by a legacy flat key with the same name ("currency": "Валюта").
  it.each([...features.keys()])(
    'feature "%s" texts are actually loaded in every language',
    (name) => {
      for (const lng of ['ru', 'uz', 'en']) {
        for (const key of leafKeys(features.get(name)![lng]).filter((k) => !k.includes('{{'))) {
          expect(i18n.t(key, { lng }), `${lng}: ${key}`).not.toBe(key)
        }
      }
    },
  )

  it('new shared keys exist in all three languages', () => {
    expect(leafKeys(uz).sort()).toEqual(leafKeys(ru).sort())
    expect(leafKeys(en).sort()).toEqual(leafKeys(ru).sort())
  })

  // Shared files are merged shallowly over the legacy ones: a shared top-level key
  // with the same name as a legacy one would silently wipe out the old texts.
  it('shared top-level keys do not collide with legacy keys', () => {
    for (const lang of ['ru', 'uz', 'en']) {
      const shared = { ru, uz, en }[lang] as Json
      expect(Object.keys(shared).filter((k) => k in legacy[lang])).toEqual([])
    }
  })

  it.each([...features.keys()])('feature "%s" has the same keys in ru, uz and en', (name) => {
    const bundles = features.get(name)!
    expect(Object.keys(bundles).sort()).toEqual(['en', 'ru', 'uz'])
    expect(leafKeys(bundles.uz).sort()).toEqual(leafKeys(bundles.ru).sort())
    expect(leafKeys(bundles.en).sort()).toEqual(leafKeys(bundles.ru).sort())
  })

  it.each([...features.keys()])('feature "%s" keeps its texts under its own namespace', (name) => {
    expect(Object.keys(features.get(name)!.ru)).toEqual([name])
  })
})
