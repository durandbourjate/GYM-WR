import { FIBU_TYPEN, istFachschaftMitFiBu } from './fachUtils'

const STORAGE_KEY = 'pruefung_sichtbareTypen'

const ALLE_GENERISCHEN_TYPEN = [
  'mc', 'freitext', 'zuordnung', 'lueckentext', 'richtigfalsch',
  'berechnung', 'aufgabengruppe', 'visualisierung', 'pdf',
  'sortierung', 'hotspot', 'bildbeschriftung',
  'audio', 'dragdrop_bild', 'code', 'formel'
]

const FIBU_TYPEN_LISTE = ['buchungssatz', 'tkonto', 'kontenbestimmung', 'bilanzstruktur']

export function getAlleVerfuegbarenTypen(fachschaften: string[]): string[] {
  const typen = [...ALLE_GENERISCHEN_TYPEN]
  if (istFachschaftMitFiBu(fachschaften)) {
    typen.push(...FIBU_TYPEN_LISTE)
  }
  return typen
}

export function getSichtbareTypen(fachschaften: string[]): string[] {
  try {
    const gespeichert = localStorage.getItem(STORAGE_KEY)
    if (gespeichert) {
      const parsed = JSON.parse(gespeichert) as string[]
      // FiBu-Typen nur anzeigen wenn LP zur WR-Fachschaft gehört
      return parsed.filter(t => !FIBU_TYPEN.has(t) || istFachschaftMitFiBu(fachschaften))
    }
  } catch { /* ignore */ }
  return getAlleVerfuegbarenTypen(fachschaften)
}

export function setSichtbareTypen(typen: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(typen))
  } catch { /* ignore */ }
}
