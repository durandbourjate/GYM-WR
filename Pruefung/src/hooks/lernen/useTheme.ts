import { useState, useEffect, useCallback } from 'react'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'ueben-theme'

function getInitialTheme(): Theme {
  try {
    const gespeichert = localStorage.getItem(STORAGE_KEY)
    if (gespeichert === 'dark' || gespeichert === 'light') return gespeichert
  } catch { /* localStorage nicht verfügbar */ }
  // System-Präferenz
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

export function useUebenTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    // Initiale Klasse setzen
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const neu = prev === 'dark' ? 'light' : 'dark'
      try { localStorage.setItem(STORAGE_KEY, neu) } catch { /* ignore */ }
      return neu
    })
  }, [])

  return { theme, toggleTheme, istDark: theme === 'dark' }
}
