import { useTranslation } from 'react-i18next'
import { Shield } from 'lucide-react'

const LANGS = ['en', 'pt', 'es'] as const
const LABELS: Record<string, string> = { en: 'EN', pt: 'PT', es: 'ES' }

export default function NavBar() {
  const { t, i18n } = useTranslation()
  const current = LANGS.find(l => i18n.language.startsWith(l)) ?? 'en'

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-bg-base/80 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 text-conjur-cyan font-semibold">
          <Shield size={18} />
          <span className="hidden sm:block">Conjur Demo</span>
        </a>

        <div className="flex items-center gap-6 text-sm text-slate-400">
          <a href="#springboot" className="hover:text-spring transition-colors">{t('nav.springboot')}</a>
          <a href="#dotnet"     className="hover:text-dotnet  transition-colors">{t('nav.dotnet')}</a>
          <a href="#gha"        className="hover:text-gh transition-colors hidden sm:block">{t('nav.gha')}</a>
          <a href="#esoshop"    className="hover:text-eso transition-colors hidden md:block">{t('nav.esoshop')}</a>
          <a href="#flow"       className="hover:text-conjur-gold transition-colors hidden lg:block">{t('nav.flow')}</a>
          <a href="#livetools"  className="hover:text-conjur-cyan transition-colors hidden lg:block">{t('nav.livetools')}</a>
          <a href="#compare"    className="hover:text-conjur-gold transition-colors hidden lg:block">{t('nav.compare')}</a>

          <div className="flex items-center gap-1">
            {LANGS.map(lang => (
              <button
                key={lang}
                onClick={() => i18n.changeLanguage(lang)}
                className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors ${
                  current === lang
                    ? 'bg-conjur-cyan/20 text-conjur-cyan border border-conjur-cyan/30'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {LABELS[lang]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
