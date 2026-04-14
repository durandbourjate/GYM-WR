/**
 * Utility-Funktionen für den KMU-Kontenrahmen (Schweiz).
 * Wird für den Buchungs-Fragetyp benötigt.
 */

import kontenrahmenData from '../data/kontenrahmen-kmu.json' with { type: 'json' }

export interface KontoEintrag {
  nummer: string
  name: string
  kategorie: 'aktiv' | 'passiv' | 'aufwand' | 'ertrag'
  gruppe: string
  untergruppe?: string
}

/** Alle Konten aus dem KMU-Kontenrahmen */
export const alleKonten: KontoEintrag[] = kontenrahmenData.konten as KontoEintrag[]

/** Konto nach Nummer suchen */
export function findKonto(nummer: string): KontoEintrag | undefined {
  return alleKonten.find(k => k.nummer === nummer)
}

/** Konten nach Nummer oder Name suchen (für Autocomplete) */
export function sucheKonten(query: string, eingeschraenkt?: string[]): KontoEintrag[] {
  const pool = eingeschraenkt
    ? alleKonten.filter(k => eingeschraenkt.includes(k.nummer))
    : alleKonten
  if (!query) return pool
  const q = query.toLowerCase()
  return pool.filter(k =>
    k.nummer.startsWith(q) || k.name.toLowerCase().includes(q)
  )
}

/** Anzeige-Label: "1000 Kasse" */
export function kontoLabel(nummer: string): string {
  const k = findKonto(nummer)
  return k ? `${k.nummer} ${k.name}` : nummer
}

/** Konten nach Kategorie gruppieren */
export function kontenNachKategorie(nummern: string[]): Record<string, KontoEintrag[]> {
  const result: Record<string, KontoEintrag[]> = {}
  for (const nr of nummern) {
    const k = findKonto(nr)
    if (k) {
      ;(result[k.kategorie] ??= []).push(k)
    }
  }
  return result
}
