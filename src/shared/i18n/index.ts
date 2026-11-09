import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { usePreferences } from '@/shared/store/preferences'
import en from './locales/en.json'
import legacyEn from './locales/legacy/en.json'
import legacyRu from './locales/legacy/ru.json'
import legacyUz from './locales/legacy/uz.json'
import ru from './locales/ru.json'
import uz from './locales/uz.json'

// legacy/*.json — copied unchanged from the old panel (flat keys like "sidebar_menu_currency").
// ru/uz/en.json — new keys, nested by section ("auth.login_title"). New texts go there.
const resources = {
  ru: { translation: { ...legacyRu, ...ru } },
  uz: { translation: { ...legacyUz, ...uz } },
  en: { translation: { ...legacyEn, ...en } },
}

const initialLang = usePreferences.getState().lang

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLang,
  fallbackLng: 'ru',
  interpolation: { escapeValue: false },
})
document.documentElement.lang = initialLang

usePreferences.subscribe((state, prev) => {
  if (state.lang === prev.lang) return
  void i18n.changeLanguage(state.lang)
  document.documentElement.lang = state.lang
})

export { i18n }
