import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LANG_KEY } from '../../i18n'

export const LANGS = ['en', 'pt', 'es'] as const

// Inline SVG flags: crisp and cross-platform (emoji flags don't render on Windows).
// EN = US, PT = Brazil (LATAM audience), ES = Spain.
const FLAGS: Record<(typeof LANGS)[number], ReactNode> = {
  en: (
    <svg viewBox="0 0 20 14" className="w-full h-full" aria-hidden="true">
      <rect width="20" height="14" fill="#fff" />
      {[0, 2, 4, 6, 8, 10, 12].map(i => (
        <rect key={i} y={(i * 14) / 13} width="20" height={14 / 13} fill="#b22234" />
      ))}
      <rect width="8.4" height={(14 / 13) * 7} fill="#3c3b6e" />
    </svg>
  ),
  pt: (
    <svg viewBox="0 0 20 14" className="w-full h-full" aria-hidden="true">
      <rect width="20" height="14" fill="#009c3b" />
      <polygon points="10,1.5 18,7 10,12.5 2,7" fill="#ffdf00" />
      <circle cx="10" cy="7" r="2.9" fill="#002776" />
    </svg>
  ),
  es: (
    <svg viewBox="0 0 20 14" className="w-full h-full" aria-hidden="true">
      <rect width="20" height="14" fill="#c60b1e" />
      <rect y="3.5" width="20" height="7" fill="#ffc400" />
    </svg>
  ),
}

/** Segmented EN / PT / ES switch. `tone="dark"` for the always-dark top bar. */
export default function LanguageSwitcher({ tone = 'theme', className = '' }: { tone?: 'dark' | 'theme'; className?: string }) {
  const { t, i18n } = useTranslation()
  const current = LANGS.find(l => i18n.language.startsWith(l)) ?? 'en'
  const idle = tone === 'dark' ? 'text-slate-300 hover:text-white hover:bg-white/5' : 'text-text-2 hover:text-text hover:bg-bg-muted'
  const active = tone === 'dark'
    ? 'bg-white/10 text-white ring-1 ring-white/20'
    : 'bg-bg-muted text-text ring-1 ring-border'

  return (
    <div role="group" aria-label={t('nav.language')} className={`flex items-center gap-1 ${className}`}>
      {LANGS.map(lang => (
        <button
          key={lang}
          type="button"
          onClick={() => { try { localStorage.setItem(LANG_KEY, lang) } catch { /* private mode */ } i18n.changeLanguage(lang) }}
          aria-pressed={current === lang}
          aria-label={lang.toUpperCase()}
          className={`inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-xs font-semibold transition-colors duration-200 ${current === lang ? active : idle}`}
        >
          <span className="inline-block w-[18px] h-[13px] rounded-sm overflow-hidden ring-1 ring-black/20 shrink-0">
            {FLAGS[lang]}
          </span>
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
