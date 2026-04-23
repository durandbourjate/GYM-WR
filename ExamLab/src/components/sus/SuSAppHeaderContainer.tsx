// ExamLab/src/components/sus/SuSAppHeaderContainer.tsx
//
// Thin container: liest aus bestehenden Stores/Hooks und reicht Props an AppHeader weiter.
// Enthält keine eigene Logik — nur Datenmapping. Analogon zu LPAppHeaderContainer für SuS-Rolle.
//
// Wird hinter VITE_ENABLE_NEW_HEADER === '1' in SuS-Seiten eingehängt;
// bis dahin werden die jeweiligen Inline-Header weiterverwendet.

import type React from 'react'
import { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'
import { useUebenGruppenStore } from '../../store/ueben/gruppenStore'
import { useTabKaskadeConfigSuS } from '../shared/header/useTabKaskadeConfig.sus'
import { useGlobalSucheSuS } from '../../hooks/useGlobalSucheSuS'
import { AppHeader } from '../shared/header/AppHeader'
import type { FeedbackContext } from '../shared/FeedbackModal'
import { APP_VERSION } from '../../version'

interface Props {
  onHilfe: () => void
  // Detail-Modus pass-through
  onZurueck?: () => void
  breadcrumbs?: { label: string; aktion?: () => void }[]
  aktionsButtons?: React.ReactNode
  statusText?: string
  untertitel?: string
}

export function SuSAppHeaderContainer({
  onHilfe,
  onZurueck,
  breadcrumbs,
  aktionsButtons,
  statusText,
  untertitel,
}: Props) {
  const abmelden = useAuthStore((s) => s.abmelden)
  // AuthUser hat .name (Anzeigename) — .name ist immer befüllt nach Login.
  const benutzerName = useAuthStore((s) => s.user?.name ?? 'Schüler:in')

  // Theme: identisches Pattern wie LPAppHeaderContainer / ThemeToggle.tsx.
  const toggleMode = useThemeStore((s) => s.toggleMode)
  const mode = useThemeStore((s) => s.mode)
  const istAktuellDunkel =
    mode === 'dark' ||
    (mode === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  const theme: 'light' | 'dark' = istAktuellDunkel ? 'dark' : 'light'

  const navigate = useNavigate()
  const location = useLocation()
  const [suchen, setSuchen] = useState('')

  const feedbackContext = useMemo<FeedbackContext>(() => ({
    rolle: 'sus',
    ort: location.pathname,
    appVersion: APP_VERSION,
  }), [location.pathname])

  // Kurse aus gruppenStore — Store liefert nur Gruppen, in denen SuS Mitglied ist.
  const gruppen = useUebenGruppenStore((s) => s.gruppen)
  const kurse = useMemo(
    () => gruppen.map((g) => ({ id: g.id, label: g.name })),
    [gruppen],
  )

  const kaskadeConfig = useTabKaskadeConfigSuS({ kurse })

  // Globale Suche — SuS-seitig (Scope-Guard: keine Lösungsfelder).
  const sucheErgebnis = useGlobalSucheSuS(
    suchen,
    {
      l1: kaskadeConfig.aktivL1 as string | null,
      l2: kaskadeConfig.aktivL2 ?? null,
      l3: null,
    },
    (path) => navigate(path),
  )

  return (
    <AppHeader
      rolle="sus"
      benutzerName={benutzerName}
      theme={theme}
      onThemeToggle={toggleMode}
      onHilfe={onHilfe}
      feedbackContext={feedbackContext}
      onAbmelden={abmelden}
      kaskadeConfig={kaskadeConfig}
      suchen={suchen}
      onSuchen={setSuchen}
      sucheErgebnis={sucheErgebnis}
      onZurueck={onZurueck}
      breadcrumbs={breadcrumbs}
      aktionsButtons={aktionsButtons}
      statusText={statusText}
      untertitel={untertitel}
    />
  )
}
