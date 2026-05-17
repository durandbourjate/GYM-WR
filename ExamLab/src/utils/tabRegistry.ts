/**
 * Zentrale Tab-Registry (Single source of truth) für ExamLab-Surfaces
 * mit Tab-Strukturen. Konsumiert von Tab-Renderern + Favoriten-Picker
 * + globaler Suche (Cluster C).
 */

export type TabSurface = 'einstellungen' | 'hilfe'

export interface TabContext {
  /** True wenn der eingeloggte LP in `Stammdaten.admins` enthalten ist. */
  istAdmin: boolean
}

export interface TabDefinition {
  /** Eindeutige ID innerhalb der Surface (kebab-case). */
  id: string
  surface: TabSurface
  /** Anzeigename (Deutsch). */
  titel: string
  /** Route oder Modal-Path. */
  route: string
  /** Optional: nur sichtbar wenn Funktion true zurückgibt. */
  sichtbar?: (ctx: TabContext) => boolean
  /** Optional: Lucide-Icon-Name (für Cluster B Header + Cluster E Star-Toggle). */
  icon?: string
}

export const TAB_REGISTRY: TabDefinition[] = [
  // === Einstellungen ===
  { id: 'profil',            surface: 'einstellungen', titel: 'Mein Profil',         route: '/einstellungen/profil' },
  { id: 'lernziele',         surface: 'einstellungen', titel: 'Lernziele',           route: '/einstellungen/lernziele' },
  { id: 'klassenlisten',     surface: 'einstellungen', titel: 'Klassenlisten',       route: '/einstellungen/klassenlisten',
                             icon: 'Users' },
  { id: 'favoriten',         surface: 'einstellungen', titel: 'Favoriten',           route: '/einstellungen/favoriten' },
  { id: 'problemmeldungen',  surface: 'einstellungen', titel: 'Problemmeldungen',    route: '/einstellungen/problemmeldungen' },
  { id: 'uebungen',          surface: 'einstellungen', titel: 'Übungen',             route: '/einstellungen/uebungen' },
  { id: 'fragensammlung',    surface: 'einstellungen', titel: 'Fragensammlung',      route: '/einstellungen/fragensammlung' },
  { id: 'testdaten',         surface: 'einstellungen', titel: 'Testdaten',           route: '/einstellungen/testdaten' }, // Cluster F
  { id: 'tags',              surface: 'einstellungen', titel: 'Tags',                route: '/einstellungen/tags',
                             icon: 'Tag' }, // Cluster H Phase 2 C1
  { id: 'admin',             surface: 'einstellungen', titel: 'Admin',               route: '/einstellungen/admin',
                             sichtbar: ({ istAdmin }) => istAdmin },
  { id: 'ki-kalibrierung',   surface: 'einstellungen', titel: 'KI-Kalibrierung',     route: '/einstellungen/ki-kalibrierung' },

  // === Hilfe (Workflow-Order: erstellen → durchführen → korrigieren) ===
  { id: 'einstieg',          surface: 'hilfe', titel: 'Erste Schritte',              route: '/hilfe/einstieg' },
  { id: 'fragen',            surface: 'hilfe', titel: 'Fragen & Fragensammlung',     route: '/hilfe/fragen' },
  { id: 'pruefung',          surface: 'hilfe', titel: 'Prüfung erstellen',           route: '/hilfe/pruefung' },
  { id: 'durchfuehrung',     surface: 'hilfe', titel: 'Durchführung',                route: '/hilfe/durchfuehrung' },
  { id: 'korrektur',         surface: 'hilfe', titel: 'Korrektur & Feedback',        route: '/hilfe/korrektur' },
  { id: 'ueben',             surface: 'hilfe', titel: 'Üben',                        route: '/hilfe/ueben' },
  { id: 'ki',                surface: 'hilfe', titel: 'KI-Assistent',                route: '/hilfe/ki' },
  { id: 'bloom',             surface: 'hilfe', titel: 'Bloom-Taxonomie',             route: '/hilfe/bloom' },
  { id: 'zusammenarbeit',    surface: 'hilfe', titel: 'Zusammenarbeit',              route: '/hilfe/zusammenarbeit' },
  { id: 'faq',               surface: 'hilfe', titel: 'FAQ',                         route: '/hilfe/faq' },
]

/**
 * Liefert sichtbare Tabs für eine Surface, gefiltert nach Sichtbarkeits-Predicate.
 */
export function tabsFuerSurface(surface: TabSurface, ctx: TabContext): TabDefinition[] {
  return TAB_REGISTRY.filter(t =>
    t.surface === surface && (t.sichtbar?.(ctx) ?? true)
  )
}
