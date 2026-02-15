import React, { useState, useEffect } from 'react'
import { Sun, Moon, Globe } from 'lucide-react'
import { useLocale } from '../i18n/LocaleContext'

const getInitialTheme = () => {
  const stored = localStorage.getItem('sima-theme')
  if (stored === 'light' || stored === 'dark') return stored
  return 'light'
}

export const Header = ({
  icon: Icon,
  className = '',
}) => {
  const [theme, setTheme] = useState(getInitialTheme)
  const { t, locale, setLocale } = useLocale()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('sima-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  const toggleLocale = () => setLocale(locale === 'en' ? 'ar' : 'en')

  return (
    <header className={`sc-header ${className}`.trim()}>
      <div className="sc-header__inner sc-anim-fade">
        <div className="sc-header__brand">
          {Icon ? (
            <div className="sc-header__brand-icon">
              <Icon size={26} />
            </div>
          ) : null}
          <div>
            <h1 className="sc-header__brand-title">{t('header.title')}</h1>
            <p className="sc-header__brand-subtitle">{t('header.subtitle')}</p>
          </div>
        </div>

        <div className="sc-header__stats">
          <div className="sc-stat">
            <p className="sc-stat__label">{t('header.language')}</p>
            <button
              className="sc-lang-toggle"
              onClick={toggleLocale}
              title={locale === 'en' ? 'العربية' : 'English'}
            >
              <Globe size={14} />
              <span>{locale === 'en' ? 'العربية' : 'English'}</span>
            </button>
          </div>
          <div className="sc-stat">
            <p className="sc-stat__label">{t('header.theme')}</p>
            <button
              className={`sc-theme-toggle ${theme === 'dark' ? 'sc-theme-toggle--dark' : ''}`}
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              <span className="sc-theme-toggle__track" />
              <span className="sc-theme-toggle__thumb">
                {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
