import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'

/**
 * Copy for the interactive tools (Solution finder, Compare) is a separate,
 * lazily loaded bundle: ~65 KB per language that most pages never need. It is
 * merged into the normal `translation` namespace, so keys stay `finder.*`,
 * `finder_arch.*` and `cmp.*`. English is always loaded too (fallback).
 */
const loaders: Record<string, () => Promise<{ default: Record<string, unknown> }>> = {
  en: () => import('../locales/tools/en.json'),
  pt: () => import('../locales/tools/pt.json'),
  es: () => import('../locales/tools/es.json'),
}
const loaded = new Set<string>()

async function ensure(lng: string) {
  if (loaded.has(lng) || !loaders[lng]) return
  const mod = await loaders[lng]()
  i18n.addResourceBundle(lng, 'translation', mod.default, true, true)
  loaded.add(lng)
}

/** True once the tools copy for English and the active language is present. */
export function useToolsCopy(): boolean {
  const { i18n: inst } = useTranslation()
  const base = (inst.resolvedLanguage || inst.language || 'en').split('-')[0]
  const isReady = () => loaded.has('en') && (base === 'en' || loaded.has(base) || !loaders[base])
  const [ready, setReady] = useState(isReady)
  useEffect(() => {
    let alive = true
    if (isReady()) { setReady(true); return }
    setReady(false)
    Promise.all([ensure('en'), ensure(base)]).then(() => { if (alive) setReady(true) }).catch(() => { if (alive) setReady(true) })
    return () => { alive = false }
  }, [base]) // eslint-disable-line react-hooks/exhaustive-deps
  return ready
}
