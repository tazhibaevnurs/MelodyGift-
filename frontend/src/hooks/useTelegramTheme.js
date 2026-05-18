import { useState, useEffect } from 'react'

/**
 * Syncs Telegram WebApp colorScheme to document data-theme and CSS variables.
 * Use for light/dark aware UI (slate text in light, soft white in dark).
 */
export function useTelegramTheme() {
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    try {
      const applyTheme = (scheme) => {
        const next = scheme === 'light' ? 'light' : 'dark'
        setTheme(next)
        if (document.documentElement) {
          document.documentElement.setAttribute('data-theme', next)
        }
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp
          if (tg.themeParams?.bg_color) {
            document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color)
          }
          if (tg.themeParams?.text_color) {
            document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color)
          }
        }
      }

      const scheme = window.Telegram?.WebApp?.colorScheme || 'dark'
      applyTheme(scheme)

      const handler = () => applyTheme(window.Telegram?.WebApp?.colorScheme || 'dark')
      if (window.Telegram?.WebApp?.onEvent) {
        window.Telegram.WebApp.onEvent('themeChanged', handler)
        return () => window.Telegram?.WebApp?.offEvent?.('themeChanged', handler)
      }
    } catch (e) {
      console.warn('useTelegramTheme error', e)
      if (document.documentElement) document.documentElement.setAttribute('data-theme', 'dark')
    }
  }, [])

  return theme
}
