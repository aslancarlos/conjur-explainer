import { Sun, Moon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../lib/useTheme'

/**
 * IDIRA theme toggle button. 44×44px touch target. The label stays fixed
 * ("Dark theme") and aria-pressed carries the state, as a toggle button should.
 * `tone="dark"` for placement on the always-dark top bar.
 */
export default function ThemeToggle({ className = '', tone = 'theme' }: { className?: string; tone?: 'dark' | 'theme' }) {
  const { t } = useTranslation()
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t('shell.theme_dark')}
      title={t('shell.theme_dark')}
      aria-pressed={isDark}
      className={
        'inline-flex items-center justify-center w-11 h-11 rounded-full ' +
        (tone === 'dark'
          ? 'border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 hover:border-white/30 '
          : 'border border-border bg-surface text-text hover:bg-bg-muted hover:border-text-muted ') +
        'transition-[transform,background-color,border-color] duration-200 ' +
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-idira-blue focus-visible:outline-offset-2 ' +
        'hover:rotate-12 ' +
        className
      }
    >
      {isDark
        ? <Sun  size={18} aria-hidden="true" />
        : <Moon size={18} aria-hidden="true" />}
    </button>
  )
}
