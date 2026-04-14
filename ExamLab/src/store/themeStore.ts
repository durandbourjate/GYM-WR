import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ThemeMode = 'system' | 'light' | 'dark'

interface ThemeState {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
}

/** Ermittelt ob das System Dark Mode bevorzugt */
function systemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** Wendet die Klasse 'dark' auf <html> an */
function applyTheme(mode: ThemeMode): void {
  const isDark = mode === 'dark' || (mode === 'system' && systemPrefersDark())
  document.documentElement.classList.toggle('dark', isDark)
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',

      setMode: (mode) => {
        set({ mode })
        applyTheme(mode)
      },

      toggleMode: () => {
        const current = get().mode
        // 2-Stufen-Toggle: system ↔ manuell (Gegenteil der System-Präferenz)
        if (current === 'system') {
          const next: ThemeMode = systemPrefersDark() ? 'light' : 'dark'
          set({ mode: next })
          applyTheme(next)
        } else {
          set({ mode: 'system' })
          applyTheme('system')
        }
      },
    }),
    {
      name: 'pruefung-theme',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.mode)
      },
    }
  )
)

// System-Preference-Änderungen live verfolgen
if (typeof window !== 'undefined') {
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      const { mode } = useThemeStore.getState()
      if (mode === 'system') applyTheme('system')
    })
}
