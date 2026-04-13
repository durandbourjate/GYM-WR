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
export const APP_NAVIGATION: NavigationsEintrag[] = [
  {
    pfad: '/pruefung',
    label: 'Prüfungsliste',
    icon: '📝',
    kinder: [
      { pfad: '/pruefung/tracker', label: 'Tracker', icon: '📊' },
      { pfad: '/pruefung/monitoring', label: 'Multi-Monitoring', icon: '👁️' },
    ],
  },
  {
    pfad: '/uebung',
    label: 'Übungsliste',
    icon: '🎯',
    kinder: [
      { pfad: '/uebung/durchfuehren', label: 'Durchführen', icon: '▶️' },
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
