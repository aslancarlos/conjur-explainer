import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en.json?core'

/** localStorage key holding the visitor's explicit language choice. */
export const LANG_KEY = 'idira-lang'

/** Fallback language: its full file is loaded alongside any other locale. */
const FALLBACK = 'en'

type Bundle = () => Promise<{ default: Record<string, unknown> }>

// The entry carries only the English *core* (shell + home keys, see
// localeCore in vite.config.ts). The pt/es core is fetched at startup when that
// language is active; the full files load with the first non-home route (App.tsx
// route `lazy`), on link hover, or when the browser is idle.
const coreLoaders: Record<string, Bundle> = {
  pt: () => import('./locales/pt.json?core'),
  es: () => import('./locales/es.json?core'),
}
const fullLoaders: Record<string, Bundle> = {
  en: () => import('./locales/en.json'),
  pt: () => import('./locales/pt.json'),
  es: () => import('./locales/es.json'),
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en } },
    fallbackLng: FALLBACK,
    // Every visit follows the browser language (navigator.languages), mapped
    // to the closest supported one (es-MX -> es, pt-PT -> pt, fr -> en). Only
    // an explicit choice in the language switch is stored (LANG_KEY) and wins.
    supportedLngs: ['en', 'pt', 'es'],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: LANG_KEY,
      caches: [],
    },
    interpolation: { escapeValue: false },
    // pt/es are code-split and loaded on demand (see ensureLocale below). With
    // react-i18next's default useSuspense, a non-English detected language would
    // make useTranslation() suspend on first render, and NavBar sits outside the
    // app's Suspense boundary, so the whole tree fails to mount (blank screen).
    // Disable suspense: components render the `en` fallback immediately and
    // re-render once the real bundle arrives.
    // bindI18nStore 'added': re-render every consumer when a lazy bundle lands,
    // otherwise components that don't re-render for other reasons (sidebar,
    // hero) keep showing the English fallback.
    react: { useSuspense: false, bindI18nStore: 'added' },
  })

const baseOf = (lng?: string) => (lng || 'en').split('-')[0]

// One in-flight / settled promise per language and kind. A failed fetch is
// forgotten so the next call retries. addResourceBundle emits the store's
// 'added' event, which (bindI18nStore) re-renders every consumer.
const pending = new Map<string, Promise<void>>()
function load(kind: 'core' | 'full', base: string, loaders: Record<string, Bundle>): Promise<void> {
  const key = `${kind}:${base}`
  let p = pending.get(key)
  if (!p) {
    p = loaders[base]().then(mod => {
      i18n.addResourceBundle(base, 'translation', mod.default, true, true)
      // resolvedLanguage is only recomputed by changeLanguage: the first bundle
      // of the active language must re-run it, or consumers that read it
      // (toolsCopy) keep resolving to the English fallback. The memoized loads
      // stop the resulting 'languageChanged' from fetching again.
      if (baseOf(i18n.language) === base && i18n.resolvedLanguage !== base) void i18n.changeLanguage(i18n.language)
    })
    p.catch(() => pending.delete(key))
    pending.set(key, p)
  }
  return p.catch(() => undefined)
}

function ensureLocale(lng?: string): Promise<void> {
  const base = baseOf(lng)
  return coreLoaders[base] ? load('core', base, coreLoaders) : Promise.resolve()
}

/**
 * Merge the complete locale file for `lng` (plus English, the fallback) into
 * the `translation` namespace. Memoized; never rejects. Every route except the
 * home awaits it before committing, so a page never renders raw keys.
 */
export function ensureFullLocale(lng: string = i18n.language): Promise<void> {
  const base = fullLoaders[baseOf(lng)] ? baseOf(lng) : FALLBACK
  const jobs = [load('full', base, fullLoaders)]
  if (base !== FALLBACK) jobs.push(load('full', FALLBACK, fullLoaders))
  return Promise.all(jobs).then(() => undefined)
}

// Keep the document language in sync so screen readers announce content in the
// active locale (WCAG 3.1.2). index.html ships lang="en"; update it on change.
function syncDocumentLang(lng?: string) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = (lng || 'en').split('-')[0]
  }
}

// Load the detected language's core at startup (if not English) and, on every
// change, the core and the full file together (the small core lands first).
// The router does not refetch the active route, so the store's 'added' event is
// what re-renders the current page with its full strings.
// main.tsx awaits `localeReady` before the first render, so a returning pt/es
// visitor never sees an English flash (and no component misses the update).
export const localeReady = ensureLocale(i18n.language)
syncDocumentLang(i18n.language)
i18n.on('languageChanged', (lng) => {
  void ensureLocale(lng)
  void ensureFullLocale(lng)
  syncDocumentLang(lng)
})

export default i18n
