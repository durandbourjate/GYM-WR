export interface NavigationsEintrag {
  pfad: string
  label: string
  /** Lucide-Component-Name als String (canonical Form seit #4 NavIcon-Persist-Migration,
   *  17.05.2026). Wird via NavIcon.tsx zur Render-Zeit auf eine Lucide-Komponente
   *  aufgelöst. Legacy-Emoji-Strings werden vom NavIcon-Render-Helper noch akzeptiert,
   *  aber nicht mehr hier gepflegt. */
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
    icon: 'ClipboardList',
    kinder: [
      { pfad: '/pruefung/tracker', label: 'Analyse', icon: 'BarChart3' },
      { pfad: '/pruefung/monitoring', label: 'Multi-Monitoring', icon: 'Eye' },
    ],
  },
  {
    // Haupt-Tab "Üben" führt auf den Sub-Tab "Übungen" (Default).
    pfad: '/uebung',
    label: 'Üben',
    icon: 'Target',
    kinder: [
      { pfad: '/uebung/durchfuehren', label: 'Übung durchführen', icon: 'Play' },
      { pfad: '/uebung/analyse', label: 'Analyse', icon: 'TrendingUp' },
    ],
  },
  {
    pfad: '/fragensammlung',
    label: 'Fragensammlung',
    icon: 'BookOpen',
  },
  {
    pfad: '/einstellungen',
    label: 'Einstellungen',
    icon: 'Settings',
    kinder: [
      { pfad: '/einstellungen/profil', label: 'Profil', icon: 'User' },
      { pfad: '/einstellungen/lernziele', label: 'Lernziele', icon: 'GraduationCap' },
      { pfad: '/einstellungen/favoriten', label: 'Favoriten', icon: 'Star' },
      { pfad: '/einstellungen/admin', label: 'Admin', icon: 'Wrench', nurAdmin: true },
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
