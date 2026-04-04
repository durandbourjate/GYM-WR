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

/** Prüft ob die LP FiBu-Fragetypen sehen darf */
export function istFachschaftMitFiBu(fachschaften: string[]): boolean {
  return fachschaften.includes('WR')
}

/** Default-Fach aus Fachschaften ableiten */
const FACHSCHAFT_ZU_FACH: Record<string, string> = {
  'WR': 'Wirtschaft & Recht',
  'IN': 'Informatik',
  'DE': 'Deutsch',
  'FR': 'Französisch',
  'EN': 'Englisch',
  'MA': 'Mathematik',
  'BI': 'Biologie',
  'CH': 'Chemie',
  'PH': 'Physik',
  'GS': 'Geschichte',
  'GG': 'Geografie',
  'BG': 'Bildnerisches Gestalten',
  'MU': 'Musik',
  'SP': 'Sport',
  'PL': 'Philosophie',
  'LA': 'Latein',
}

export function defaultFach(fachschaften: string[]): string {
  for (const fs of fachschaften) {
    if (FACHSCHAFT_ZU_FACH[fs]) return FACHSCHAFT_ZU_FACH[fs]
  }
  return 'Allgemein'
}

/** Badge-Klassen für Fachbereich */
export function fachbereichFarbe(fachbereich: string): string {
  switch (fachbereich) {
    case 'VWL': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    case 'BWL': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    case 'Recht': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    case 'Informatik': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
  }
}

/** Prüft ob die Fachschaft WR ist */
export function istWRFachschaft(fachschaft?: string): boolean {
  return fachschaft === 'WR'
}

/** Default-Fachbereich aus Fachschaft */
export function defaultFachbereich(fachschaft?: string): string {
  if (fachschaft === 'WR') return 'VWL'
  if (fachschaft === 'IN' || fachschaft === 'Informatik') return 'Informatik'
  return 'Allgemein'
}
