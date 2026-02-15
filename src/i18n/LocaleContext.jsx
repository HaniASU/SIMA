import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { en } from './en'
import { ar } from './ar'

const locales = { en, ar }

const LocaleContext = createContext()

/**
 * Resolves a dot-notation key from a translations object.
 * Example: resolve(obj, 'header.queue') → obj.header.queue
 */
const resolve = (obj, path) => {
  return path.split('.').reduce((acc, key) => acc?.[key], obj) ?? path
}

export const LocaleProvider = ({ children }) => {
  const [locale, setLocaleState] = useState(() => {
    return localStorage.getItem('sima-locale') || 'en'
  })

  const setLocale = useCallback((newLocale) => {
    if (locales[newLocale]) {
      setLocaleState(newLocale)
    }
  }, [])

  // Apply dir and lang to <html> whenever locale changes
  useEffect(() => {
    const dir = locale === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.setAttribute('dir', dir)
    document.documentElement.setAttribute('lang', locale)
    localStorage.setItem('sima-locale', locale)
  }, [locale])

  const t = useCallback((key) => {
    return resolve(locales[locale], key)
  }, [locale])

  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <LocaleContext.Provider value={{ t, locale, setLocale, dir }}>
      {children}
    </LocaleContext.Provider>
  )
}

export const useLocale = () => {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within a LocaleProvider')
  return ctx
}
