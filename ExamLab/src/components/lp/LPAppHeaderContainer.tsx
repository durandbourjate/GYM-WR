// ExamLab/src/components/lp/LPAppHeaderContainer.tsx
//
// Thin container: liest aus bestehenden Stores/Hooks und reicht Props an AppHeader weiter.
// Enthält keine eigene Logik — nur Datenmapping.
//
// Wird in Task 2.2 hinter einem Feature-Flag in die LP-Seiten eingehängt;
// bis dahin wird LPHeader.tsx weiterhin verwendet.

import type React from 'react'
import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useL3Precedence } from '../shared/header/useL3Precedence'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'
import { useUebenGruppenStore } from '../../store/ueben/gruppenStore'
import { useTabKaskadeConfigLP } from '../shared/header/useTabKaskadeConfig.lp'
import { useGlobalSucheLP } from '../../hooks/useGlobalSucheLP'
import { AppHeader } from '../shared/header/AppHeader'

interface Props {
  onHilfe: () => void
  onFeedback: () => void
  onEinstellungen: () => void
  // Detail-Modus pass-through
  onZurueck?: () => void
  breadcrumbs?: { label: string; aktion?: () => void }[]
  aktionsButtons?: React.ReactNode
  statusText?: string
  untertitel?: string
}

export function LPAppHeaderContainer({ onHilfe, onFeedback, onEinstellungen, onZurueck, breadcrumbs, aktionsButtons, statusText, untertitel }: Props) {
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

  // Kurse: alle Gruppen aus dem UebenGruppenStore, gefiltert auf Gruppen wo LP Admin ist.
  const gruppen = useUebenGruppenStore((s) => s.gruppen)
  const userEmail = useAuthStore((s) => s.user?.email ?? '')
  const kurse = useMemo(
    () =>
      gruppen
        .filter((g) => g.adminEmail.toLowerCase() === userEmail.toLowerCase())
        .map((g) => ({ id: g.id, label: g.name })),
    [gruppen, userEmail],
  )

  // Auto-Select: Wenn LP auf /uebung ohne :kursId, zu letztem/erstem Kurs umleiten
  const urlKursId = (location.pathname.match(/^\/uebung\/kurs\/([^/?]+)/)?.[1]) ?? null
  const istUebungBereich =
    location.pathname.startsWith('/uebung') &&
    !location.pathname.startsWith('/uebung/durchfuehren') &&
    !location.pathname.startsWith('/uebung/analyse')
  useL3Precedence({
    urlWert: istUebungBereich ? urlKursId : null,
    storageKey: 'examlab-ueben-letzter-kurs',
    aufRedirect: (to, opts) => navigate(to, opts),
    basePath: '/uebung',
  })

  // Fallback: Wenn auf /uebung-Root UND kein kurs in URL UND kein localStorage → ersten Kurs wählen
  useEffect(() => {
    if (urlKursId) return
    const istUebungenRoot = location.pathname === '/uebung' || location.pathname === '/uebung/'
    if (!istUebungenRoot) return
    try {
      const stored = localStorage.getItem('examlab-ueben-letzter-kurs')
      if (stored) return // useL3Precedence kümmert sich darum
    } catch {
      /* ignore */
    }
    if (kurse.length > 0) {
      navigate(`/uebung/kurs/${kurse[0].id}`, { replace: true })
    }
  }, [urlKursId, location.pathname, kurse, navigate])

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
      onFeedback={onFeedback}
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
