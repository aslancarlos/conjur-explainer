import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en.json'

// English ships in the initial bundle (it is the default and the fallback).
// The other locales are code-split and fetched on demand the first time they
// are selected, keeping pt/es out of the initial download.
const loaders: Record<string, () => Promise<{ default: Record<string, unknown> }>> = {
  pt: () => import('./locales/pt.json'),
  es: () => import('./locales/es.json'),
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en } },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    // pt/es are code-split and loaded on demand (see ensureLocale below). With
    // react-i18next's default useSuspense, a non-English detected language would
    // make useTranslation() suspend on first render — and NavBar sits outside the
    // app's Suspense boundary, so the whole tree fails to mount (blank screen).
    // Disable suspense: components render the `en` fallback immediately and
    // re-render once the real bundle arrives.
    react: { useSuspense: false },
  })

async function ensureLocale(lng?: string) {
  const base = (lng || 'en').split('-')[0]
  if (base === 'en' || !loaders[base] || i18n.hasResourceBundle(base, 'translation')) return
  const mod = await loaders[base]()
  i18n.addResourceBundle(base, 'translation', mod.default, true, true)
  // Re-emit so components re-render now that the bundle is present. The
  // hasResourceBundle guard above stops this from recursing.
  if (i18n.language.split('-')[0] === base) i18n.changeLanguage(base)
}

// Keep the document language in sync so screen readers announce content in the
// active locale (WCAG 3.1.2). index.html ships lang="en"; update it on change.
function syncDocumentLang(lng?: string) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = (lng || 'en').split('-')[0]
  }
}

// Load the detected language at startup (if not English) and on every change.
ensureLocale(i18n.language)
syncDocumentLang(i18n.language)
i18n.on('languageChanged', (lng) => {
  ensureLocale(lng)
  syncDocumentLang(lng)
})

export default i18n
