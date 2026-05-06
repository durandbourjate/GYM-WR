import type { Frage } from '../../../../../types/fragen-storage'

/** Schaetzt den Zeitbedarf einer Frage in Minuten basierend auf Typ und Punktzahl */
export function schaetzeZeitbedarf(frage: Frage): number {
  switch (frage.typ) {
    case 'mc': return Math.max(1, Math.ceil(frage.punkte * 0.5))
    case 'richtigfalsch': return Math.max(1, Math.ceil(frage.punkte * 0.5))
    case 'freitext': return Math.max(2, frage.punkte * 2)
    case 'lueckentext': return Math.max(1, frage.punkte)
    case 'zuordnung': return Math.max(1, frage.punkte)
    case 'berechnung': return Math.max(2, frage.punkte * 2)
    case 'buchungssatz': return Math.max(3, frage.punkte * 1.5)
    case 'tkonto': return Math.max(5, frage.punkte * 2)
    case 'kontenbestimmung': return Math.max(2, frage.punkte)
    case 'bilanzstruktur': return Math.max(10, frage.punkte * 3)
    case 'aufgabengruppe': return Math.max(5, frage.punkte * 2)
    default: return frage.punkte
  }
}
