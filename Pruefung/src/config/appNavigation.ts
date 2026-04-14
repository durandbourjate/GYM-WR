export interface NavigationsEintrag {
  pfad: string
  label: string
  icon: string
  kinder?: NavigationsEintrag[]
  nurAdmin?: boolean
}

/**
 * Zentrale Baumstruktur aller navigierbaren LP-Orte.
 * Single Source of Truth für FavoritenTab und Navigation.
 */
/**
 * Baumstruktur entspricht den Tabs in der ExamLab-UI.
 * Labels = Tab-Beschriftungen (Prüfen, Üben, Prüfungen, Analyse, …).
 * Favoriten-Haupttab ist nicht aufgeführt — man befindet sich dort beim
 * Favoriten-Verwalten selbst.
 */
export const APP_NAVIGATION: NavigationsEintrag[] = [
  {
    // Haupt-Tab "Prüfen" führt auf den Sub-Tab "Prüfungen" (Default).
    pfad: '/pruefung',
    label: 'Prüfen',
    icon: '📝',
    kinder: [
      { pfad: '/pruefung/tracker', label: 'Analyse', icon: '📊' },
      { pfad: '/pruefung/monitoring', label: 'Multi-Monitoring', icon: '👁️' },
    ],
  },
  {
    // Haupt-Tab "Üben" führt auf den Sub-Tab "Übungen" (Default).
    pfad: '/uebung',
    label: 'Üben',
    icon: '🎯',
    kinder: [
      { pfad: '/uebung/durchfuehren', label: 'Übung durchführen', icon: '▶️' },
      { pfad: '/uebung/analyse', label: 'Analyse', icon: '📈' },
    ],
  },
  {
    pfad: '/fragensammlung',
    label: 'Fragensammlung',
    icon: '📚',
  },
  {
    pfad: '/einstellungen',
    label: 'Einstellungen',
    icon: '⚙️',
    kinder: [
      { pfad: '/einstellungen/profil', label: 'Profil', icon: '👤' },
      { pfad: '/einstellungen/lernziele', label: 'Lernziele', icon: '🎓' },
      { pfad: '/einstellungen/favoriten', label: 'Favoriten', icon: '⭐' },
      { pfad: '/einstellungen/admin', label: 'Admin', icon: '🔧', nurAdmin: true },
    ],
  },
]

/** Flache Liste aller Einträge (Knoten + Blätter) */
export function alleNavigationsEintraege(eintraege: NavigationsEintrag[] = APP_NAVIGATION): NavigationsEintrag[] {
  const result: NavigationsEintrag[] = []
  for (const e of eintraege) {
    result.push(e)
    if (e.kinder) result.push(...alleNavigationsEintraege(e.kinder))
  }
  return result
}
