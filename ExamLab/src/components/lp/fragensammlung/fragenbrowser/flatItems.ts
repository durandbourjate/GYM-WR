/**
 * Flat-Items-Modell für die virtualisierte Fragensammlung.
 *
 * Extrahiert aus `VirtualisierteFragenListe.tsx` für only-export-components:
 * der React-Component-File darf nur die Component exportieren, Helpers leben
 * separat.
 */
import type {
  FilterbareFrage,
  GruppierteAnzeige,
} from '../../../../hooks/useFragenFilter.ts'
import type { Gruppierung } from './gruppenHelfer.ts'

export type FlatItem =
  | {
      typ: 'header'
      gruppeKey: string
      gruppeLabel: string
      fragenAnzahl: number
      istAufgeklappt: boolean
    }
  | { typ: 'frage'; frage: FilterbareFrage; gruppeKey: string }

/**
 * Plattet die gruppierte Anzeige zu einem flachen Item-Array.
 * - Bei `gruppierung === 'keine'`: nur Frage-Items, keine Header.
 * - Bei aktiver Gruppierung: Header pro Gruppe + Fragen nur wenn aufgeklappt.
 */
export function baueFlatItems(
  gruppierteAnzeige: GruppierteAnzeige[],
  gruppierung: Gruppierung,
  aufgeklappteGruppen: Set<string>,
): FlatItem[] {
  const items: FlatItem[] = []
  if (gruppierung === 'keine') {
    for (const gruppe of gruppierteAnzeige) {
      for (const frage of gruppe.fragen) {
        items.push({ typ: 'frage', frage, gruppeKey: gruppe.key })
      }
    }
    return items
  }
  for (const gruppe of gruppierteAnzeige) {
    const istAufgeklappt = aufgeklappteGruppen.has(gruppe.key)
    items.push({
      typ: 'header',
      gruppeKey: gruppe.key,
      gruppeLabel: gruppe.label,
      fragenAnzahl: gruppe.fragen.length,
      istAufgeklappt,
    })
    if (istAufgeklappt) {
      for (const frage of gruppe.fragen) {
        items.push({ typ: 'frage', frage, gruppeKey: gruppe.key })
      }
    }
  }
  return items
}
