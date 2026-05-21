import { useTranslation } from 'react-i18next'
import { ExternalLink, Github, Shield } from 'lucide-react'

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="py-12 px-6 border-t border-border bg-bg-card/50">
      <div className="max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-3 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-conjur-cyan" />
              <span className="font-bold text-white text-sm">Conjur Demo</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{t('footer.desc')}</p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('footer.apps')}</p>
            <ul className="space-y-2">
              <li>
                <a href="/springboot/dashboard" target="_blank" rel="noopener"
                  className="text-xs text-slate-400 hover:text-spring transition-colors flex items-center gap-1.5">
                  <ExternalLink size={10} /> Spring Boot Dashboard
                </a>
              </li>
              <li>
                <a href="/dotnet/usuarios" target="_blank" rel="noopener"
                  className="text-xs text-slate-400 hover:text-dotnet transition-colors flex items-center gap-1.5">
                  <ExternalLink size={10} /> .NET Usuarios
                </a>
              </li>
              <li>
                <a href="/grafana" target="_blank" rel="noopener"
                  className="text-xs text-slate-400 hover:text-conjur-gold transition-colors flex items-center gap-1.5">
                  <ExternalLink size={10} /> Grafana
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('footer.resources')}</p>
            <ul className="space-y-2">
              <li>
                <a href="https://docs.conjur.org" target="_blank" rel="noopener"
                  className="text-xs text-slate-400 hover:text-conjur-cyan transition-colors flex items-center gap-1.5">
                  <ExternalLink size={10} /> Conjur Docs
                </a>
              </li>
              <li>
                <a href="https://github.com/cyberark" target="_blank" rel="noopener"
                  className="text-xs text-slate-400 hover:text-conjur-cyan transition-colors flex items-center gap-1.5">
                  <Github size={10} /> CyberArk GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-600">{t('footer.copyright')}</p>
          <p className="text-xs text-slate-600">
            {t('footer.built_with')}{' '}
            <span className="text-spring">Spring Boot</span>{' '}
            <span className="text-slate-600">&amp;</span>{' '}
            <span className="text-dotnet">.NET</span>{' '}
            <span className="text-slate-600">+</span>{' '}
            <span className="text-conjur-cyan">CyberArk Conjur</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
