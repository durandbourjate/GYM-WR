// ExamLab/src/components/lp/LPAppHeaderContainer.tsx
//
// Thin container: liest aus bestehenden Stores/Hooks und reicht Props an AppHeader weiter.
// Enthält keine eigene Logik — nur Datenmapping.
//
// Wird in Task 2.2 hinter einem Feature-Flag in die LP-Seiten eingehängt;
// bis dahin wird LPHeader.tsx weiterhin verwendet.

import type React from 'react'
import { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'
import { useUebenGruppenStore } from '../../store/ueben/gruppenStore'
import { useTabKaskadeConfigLP } from '../shared/header/useTabKaskadeConfig.lp'
import { useGlobalSucheLP } from '../../hooks/useGlobalSucheLP'
import { AppHeader } from '../shared/header/AppHeader'
import type { FeedbackContext } from '../shared/FeedbackModal'
import { APP_VERSION } from '../../version'

interface Props {
  onHilfe: () => void
  onEinstellungen: () => void
  // Detail-Modus pass-through
  onZurueck?: () => void
  breadcrumbs?: { label: string; aktion?: () => void }[]
  aktionsButtons?: React.ReactNode
  statusText?: string
  untertitel?: string
}

export function LPAppHeaderContainer({ onHilfe, onEinstellungen, onZurueck, breadcrumbs, aktionsButtons, statusText, untertitel }: Props) {
  const abmelden = useAuthStore((s) => s.abmelden)
  // AuthUser hat .name (Anzeigename), .vorname, .nachname, .email — .name ist immer befüllt.
  const benutzerName = useAuthStore((s) => s.user?.name ?? 'Lehrperson')

  // Theme: useThemeStore (Zustand-Store mit Persistenz) — identisches Pattern wie ThemeToggle.tsx.
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
    rolle: 'lp',
    ort: location.pathname,
    appVersion: APP_VERSION,
  }), [location.pathname])

  // Kurse: alle Gruppen aus dem UebenGruppenStore.
  // ladeGruppen(email) gibt bereits nur Gruppen zurück, auf die der User Zugriff hat
  // (Admin ODER Mitglied) — kein weiterer Filter nötig.
  const gruppen = useUebenGruppenStore((s) => s.gruppen)
  const kurse = useMemo(
    () => gruppen.map((g) => ({ id: g.id, label: g.name })),
    [gruppen],
  )

  // Kaskaden-Konfiguration aus Route.
  // Pruefungen/aktivePruefungen: kein globaler Store vorhanden — TODO: anbinden wenn Store existiert.
  const kaskadeConfig = useTabKaskadeConfigLP({
    kurse,
    pruefungen: [], // TODO: globalen PruefungsStore anbinden wenn verfügbar
    aktivePruefungen: [],
  })

  // Globale Suche — Prüfungen und Kurse noch nicht angebunden (stubs im Hook).
  const sucheErgebnis = useGlobalSucheLP(
    suchen,
    {
      l1: kaskadeConfig.aktivL1 ?? null,
      l2: kaskadeConfig.aktivL2 ?? null,
      l3: null,
    },
    (path) => navigate(path),
  )

  return (
    <AppHeader
      rolle="lp"
      benutzerName={benutzerName}
      theme={theme}
      onThemeToggle={toggleMode}
      onHilfe={onHilfe}
      feedbackContext={feedbackContext}
      onAbmelden={abmelden}
      onEinstellungen={onEinstellungen}
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
