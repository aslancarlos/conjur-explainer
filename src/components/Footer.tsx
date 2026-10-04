import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail } from 'lucide-react'

const CONTACT = 'asramos@paloaltonetworks.com'

/** Simple footer: who builds and maintains the site, and one way to reach him. */
export default function Footer() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const subject = `${t('shell.site_name')}: ${t('footer.mail_subject')}`
  const body = `${t('footer.mail_page')}: https://demo.minha.cloud${pathname}\n\n`
  const href = `mailto:${CONTACT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

  return (
    <footer className="border-t border-border bg-bg-card/50 px-6 py-6">
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="text-sm text-text-muted leading-relaxed">
          © {new Date().getFullYear()} {t('shell.site_name')} · {t('footer.made_by')}{' '}
          <span translate="no" className="font-medium text-text">Aslan Carlos Ramos</span>
          <span className="block text-xs">{t('footer.role')}</span>
        </p>
        <a href={href}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-bg-card px-5 text-sm font-medium text-text transition-colors duration-200 hover:border-idira-blue hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue">
          <Mail size={16} aria-hidden="true" className="text-tone-accent" />
          {t('footer.contact')}
        </a>
      </div>
    </footer>
  )
}
