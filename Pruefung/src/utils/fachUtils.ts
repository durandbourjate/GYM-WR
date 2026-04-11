import type { Tag } from '../types/tags'
import { DEFAULT_STAMMDATEN, type Stammdaten } from '../types/stammdaten'

/** Fachschaft-Kürzel → Fach-Name aus Stammdaten (mit Fallback auf Default) */
export function fachschaftZuFach(kuerzel: string, stammdaten?: Stammdaten): string {
  const sd = stammdaten ?? DEFAULT_STAMMDATEN
  const fach = sd.faecher.find(f => f.kuerzel === kuerzel)
  if (fach) return fach.name
  return FACHSCHAFT_ZU_FACH[kuerzel] || 'Allgemein'
}

/** Fachbereiche aus Stammdaten lesen (alle Fachbereich-Tags aller Fachschaften) */
export function schulFachbereiche(stammdaten?: Stammdaten): Set<string> {
  const sd = stammdaten ?? DEFAULT_STAMMDATEN
  const bereiche = new Set<string>()
  for (const fs of sd.fachschaften) {
    if (fs.fachbereichTags) {
      for (const tag of fs.fachbereichTags) {
        bereiche.add(tag.name)
      }
    }
  }
  // Fallback: WR-Fachbereiche
  if (bereiche.size === 0) {
    bereiche.add('VWL')
    bereiche.add('BWL')
    bereiche.add('Recht')
    bereiche.add('Informatik')
  }
  return bereiche
}

/** Tailwind Badge-Klassen für einen Tag */
export function tagBadgeKlassen(tag: Tag): string {
  // Dark-Mode: opacity-basiert (konsistent mit bestehendem Code)
  const farbenMap: Record<string, string> = {
    '#f97316': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    '#3b82f6': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    '#22c55e': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    '#6b7280': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    '#10b981': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    '#6366f1': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    '#8b5cf6': 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
    '#ec4899': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  }
  return farbenMap[tag.farbe] || 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
}

/** Prüft ob die LP FiBu-Fragetypen sehen darf */
export function istFachschaftMitFiBu(fachschaften: string[]): boolean {
  return fachschaften.includes('WR')
}

/** Default-Fach aus Fachschaften ableiten.
 * Kürzel gemäss offizieller Kürzelliste Gym Hofwil SJ2025/26.
 * Unterstützt alte (DE, FR, etc.) und neue (D, F, etc.) Kürzel für Abwärtskompatibilität.
 */
const FACHSCHAFT_ZU_FACH: Record<string, string> = {
  'WR': 'Wirtschaft & Recht',
  'IN': 'Informatik',
  'D': 'Deutsch', 'DE': 'Deutsch',
  'F': 'Französisch', 'FR': 'Französisch',
  'E': 'Englisch', 'EN': 'Englisch',
  'M': 'Mathematik', 'MA': 'Mathematik',
  'B': 'Biologie', 'BI': 'Biologie',
  'C': 'Chemie', 'CH': 'Chemie',
  'P': 'Physik', 'PH': 'Physik',
  'G': 'Geschichte', 'GS': 'Geschichte',
  'GG': 'Geografie',
  'BG': 'Bildnerisches Gestalten',
  'MU': 'Musik',
  'SP': 'Sport',
  'RL': 'Religionslehre',
  'PL': 'Philosophie',
  'PPP': 'Pädagogik Psychologie Philosophie',
  'S': 'Spanisch',
  'LA': 'Latein',
}

export function defaultFach(fachschaften: string[]): string {
  for (const fs of fachschaften) {
    if (FACHSCHAFT_ZU_FACH[fs]) return FACHSCHAFT_ZU_FACH[fs]
  }
  return 'Allgemein'
}

/** Human-readable Label für Fragetypen */
export function typLabel(typ: string): string {
  const labels: Record<string, string> = {
    mc: 'Multiple Choice',
    freitext: 'Freitext',
    zuordnung: 'Zuordnung',
    lueckentext: 'Lückentext',
    visualisierung: 'Zeichnen',
    richtigfalsch: 'Richtig/Falsch',
    berechnung: 'Berechnung',
    buchungssatz: 'Buchungssatz',
    tkonto: 'T-Konto',
    kontenbestimmung: 'Kontenbestimmung',
    bilanzstruktur: 'Bilanz/ER',
    aufgabengruppe: 'Aufgabengruppe',
    pdf: 'PDF-Annotation',
    sortierung: 'Sortierung',
    hotspot: 'Hotspot',
    bildbeschriftung: 'Bildbeschriftung',
    audio: 'Audio-Aufnahme',
    dragdrop_bild: 'Drag & Drop Bild',
    code: 'Code-Editor',
    formel: 'Formel (LaTeX)',
  }
  return labels[typ] || typ
}

/** Bloom-Stufen-Label */
export function bloomLabel(stufe: string): string {
  const labels: Record<string, string> = {
    K1: 'Wissen',
    K2: 'Verstehen',
    K3: 'Anwenden',
    K4: 'Analysieren',
    K5: 'Beurteilen',
    K6: 'Erschaffen',
  }
  return labels[stufe] || ''
}

/** FiBu-Fragetypen (nur für WR) */
export const FIBU_TYPEN = new Set(['buchungssatz', 'tkonto', 'kontenbestimmung', 'bilanzstruktur'])

// === BACKWARD COMPATIBILITY (Übergangsphase) ===
// Diese Funktionen werden in Tasks 4-6 durch neue Logik ersetzt,
// existieren aber während der Migration als Brücke.

/** @deprecated Use tagBadgeKlassen instead */
export function fachbereichFarbe(fachbereich: string): string {
  switch (fachbereich) {
    case 'VWL': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    case 'BWL': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    case 'Recht': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    case 'Informatik': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
  }
}

/** @deprecated Use istFachschaftMitFiBu instead */
export function istWRFachschaft(fachschaft?: string): boolean {
  return fachschaft === 'WR'
}

/** @deprecated Use defaultFach instead */
export function defaultFachbereich(fachschaft?: string): string {
  if (fachschaft === 'WR') return 'VWL'
  if (fachschaft === 'IN' || fachschaft === 'Informatik') return 'Informatik'
  return 'Allgemein'
}

/** @deprecated - Fachbereich-Badge wird durch Tag-Badges ersetzt */
export function zeigeFachbereichBadge(fachbereich: string): boolean {
  return new Set(['VWL', 'BWL', 'Recht']).has(fachbereich)
}
