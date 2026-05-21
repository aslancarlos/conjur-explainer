import { useTranslation } from 'react-i18next'
import { Shield } from 'lucide-react'

export default function NavBar() {
  const { t, i18n } = useTranslation()
  const toggle = () => i18n.changeLanguage(i18n.language.startsWith('pt') ? 'en' : 'pt')

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
          <a href="#compare"    className="hover:text-conjur-cyan transition-colors">{t('nav.compare')}</a>
          <button
            onClick={toggle}
            className="badge bg-border text-slate-300 hover:bg-conjur-cyan/20 hover:text-conjur-cyan transition-colors cursor-pointer"
          >
            {t('nav.lang')}
          </button>
        </div>
      </div>
    </nav>
  )
}
